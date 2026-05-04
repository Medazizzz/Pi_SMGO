package com.example.contentmanagement.repository;

import com.example.contentmanagement.dto.ContentAnalyticsDTO;
import com.example.contentmanagement.dto.ContentSearchResultDTO;
import com.example.contentmanagement.entity.ContentCategory;
import com.example.contentmanagement.entity.ContentStatus;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Repository
@RequiredArgsConstructor
public class ContentRepositoryImpl implements ContentRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public List<ContentAnalyticsDTO> findContentAnalytics(String category, String genreKeyword, int limit) {
        List<AggregationOperation> ops = new ArrayList<>();

        if (hasText(category)) {
            ops.add(Aggregation.match(Criteria.where("category").is(category.toUpperCase(Locale.ROOT))));
        }

        ops.add(rawStage(new Document("$addFields", new Document("genreObjectIds",
            new Document("$map", new Document("input", "$genreIds")
                .append("as", "g")
                .append("in", new Document("$convert", new Document("input", "$$g")
                    .append("to", "objectId")
                    .append("onError", null)
                    .append("onNull", null))))))));
        ops.add(Aggregation.lookup("genres", "genreObjectIds", "_id", "genreDocs"));
        ops.add(Aggregation.unwind("$genreDocs", true));

        if (hasText(genreKeyword)) {
            Pattern pattern = Pattern.compile(Pattern.quote(genreKeyword), Pattern.CASE_INSENSITIVE);
            ops.add(Aggregation.match(Criteria.where("genreDocs.name").regex(pattern)));
        }

        ops.add(Aggregation.group("$_id")
                .first("$_id").as("contentId")
                .first("$title").as("title")
                .first("$category").as("category")
                .addToSet("$genreDocs.name").as("genres")
                .first("$viewCount").as("viewCount")
                .first("$comments").as("comments"));

        ops.add(rawStage(new Document("$addFields", new Document("commentsCount",
                new Document("$size", new Document("$ifNull", new Object[]{"$comments", Collections.emptyList()}))))));

        ops.add(rawStage(new Document("$addFields", new Document("engagementScore",
                new Document("$add", new Object[]{
                        new Document("$multiply", new Object[]{"$viewCount", 0.7d}),
                        new Document("$multiply", new Object[]{"$commentsCount", 3.0d})
                })))));

        ops.add(Aggregation.sort(Sort.by(Sort.Direction.DESC, "engagementScore")
                .and(Sort.by(Sort.Direction.DESC, "viewCount"))));
        ops.add(Aggregation.limit(Math.max(1, limit)));

        List<Document> docs = mongoTemplate.aggregate(
                Aggregation.newAggregation(ops),
                "contents",
                Document.class
        ).getMappedResults();

        List<ContentAnalyticsDTO> result = new ArrayList<>();
        for (Document doc : docs) {
            int viewCount = asInt(doc.get("viewCount"));
            int commentsCount = asDocumentList(doc.get("comments")).size();
            double engagementScore = (viewCount * 0.7d) + (commentsCount * 3.0d);

            result.add(ContentAnalyticsDTO.builder()
                    .contentId(asString(doc.get("contentId")))
                    .title(asString(doc.get("title")))
                    .category(parseCategory(asString(doc.get("category"))))
                    .genres(asStringList(doc.get("genres")))
                    .viewCount(viewCount)
                    .commentsCount(commentsCount)
                    .engagementScore(engagementScore)
                    .build());
        }

        return result;
    }

    @Override
    public List<ContentSearchResultDTO> advancedKeywordSearch(String keyword, String genreKeyword, String category, int limit) {
        List<AggregationOperation> ops = new ArrayList<>();

        if (hasText(category)) {
            ops.add(Aggregation.match(Criteria.where("category").is(category.toUpperCase(Locale.ROOT))));
        }

        ops.add(rawStage(new Document("$addFields", new Document("genreObjectIds",
            new Document("$map", new Document("input", "$genreIds")
                .append("as", "g")
                .append("in", new Document("$convert", new Document("input", "$$g")
                    .append("to", "objectId")
                    .append("onError", null)
                    .append("onNull", null))))))));
        ops.add(Aggregation.lookup("genres", "genreObjectIds", "_id", "genreDocs"));
        ops.add(Aggregation.unwind("$genreDocs", true));

        if (hasText(keyword)) {
            Pattern pattern = Pattern.compile(Pattern.quote(keyword), Pattern.CASE_INSENSITIVE);
            ops.add(Aggregation.match(new Criteria().orOperator(
                    Criteria.where("title").regex(pattern),
                    Criteria.where("description").regex(pattern)
            )));
        }

        if (hasText(genreKeyword)) {
            Pattern pattern = Pattern.compile(Pattern.quote(genreKeyword), Pattern.CASE_INSENSITIVE);
            ops.add(Aggregation.match(Criteria.where("genreDocs.name").regex(pattern)));
        }

        ops.add(Aggregation.group("$_id")
                .first("$_id").as("contentId")
                .first("$title").as("title")
                .first("$description").as("description")
                .first("$category").as("category")
                .first("$status").as("status")
                .addToSet("$genreDocs.name").as("genres")
                .first("$publishAt").as("publishAt")
                .first("$releaseDate").as("releaseDate"));

        ops.add(Aggregation.sort(Sort.by(Sort.Direction.DESC, "publishAt")));
        ops.add(Aggregation.limit(Math.max(1, limit)));

        List<Document> docs = mongoTemplate.aggregate(
                Aggregation.newAggregation(ops),
                "contents",
                Document.class
        ).getMappedResults();

        List<ContentSearchResultDTO> result = new ArrayList<>();
        for (Document doc : docs) {
            result.add(ContentSearchResultDTO.builder()
                    .contentId(asString(doc.get("contentId")))
                    .title(asString(doc.get("title")))
                    .description(asString(doc.get("description")))
                    .category(parseCategory(asString(doc.get("category"))))
                    .status(parseStatus(asString(doc.get("status"))))
                    .genres(asStringList(doc.get("genres")))
                    .publishAt(asLocalDateTime(doc.get("publishAt")))
                    .releaseDate(asLocalDateTime(doc.get("releaseDate")))
                    .build());
        }

        return result;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String defaultIfBlank(String value, String fallback) {
        return hasText(value) ? value : fallback;
    }

    private int asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return value == null ? 0 : Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private List<String> asStringList(Object value) {
        if (!(value instanceof List<?> list)) {
            return new ArrayList<>();
        }
        List<String> result = new ArrayList<>();
        for (Object item : list) {
            String str = asString(item);
            if (hasText(str)) {
                result.add(str);
            }
        }
        return result;
    }

    private List<Document> asDocumentList(Object value) {
        if (!(value instanceof List<?> list)) {
            return Collections.emptyList();
        }
        List<Document> docs = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Document doc) {
                docs.add(doc);
            }
        }
        return docs;
    }

    private ContentCategory parseCategory(String category) {
        if (!hasText(category)) {
            return null;
        }
        try {
            return ContentCategory.valueOf(category);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private ContentStatus parseStatus(String status) {
        if (!hasText(status)) {
            return null;
        }
        try {
            return ContentStatus.valueOf(status);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }
        if (value instanceof java.util.Date date) {
            return LocalDateTime.ofInstant(date.toInstant(), java.time.ZoneId.systemDefault());
        }
        if (value instanceof String str && hasText(str)) {
            try {
                return LocalDateTime.parse(str);
            } catch (Exception ex) {
                return null;
            }
        }
        return null;
    }

    private AggregationOperation rawStage(Document stage) {
        return context -> stage;
    }
}