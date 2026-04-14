package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.WatchPartySearchResultDTO;
import com.example.contentmanagement.service.WatchPartySearchService;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class WatchPartySearchServiceImpl implements WatchPartySearchService {

    private final MongoTemplate mongoTemplate;

    @Override
    public List<WatchPartySearchResultDTO> searchWatchParties(String keyword) {

        String safeKeyword = keyword == null ? "" : keyword.trim();

        if (safeKeyword.isEmpty()) {
            return List.of();
        }

        Pattern regex = Pattern.compile(Pattern.quote(safeKeyword), Pattern.CASE_INSENSITIVE);

        // 1) host lookup
        LookupOperation lookupUsers = LookupOperation.newLookup()
                .from("users")
                .localField("clientId")
                .foreignField("username")
                .as("hostUsers");

        // 2) convert _id -> String
        AggregationOperation addWatchPartyIdString = context -> new Document("$addFields",
                new Document("watchPartyIdString",
                        new Document("$toString", "$_id"))
        );

        // 3) lookup feedbacks with correct type
        LookupOperation lookupFeedbacks = LookupOperation.newLookup()
                .from("feedbacks")
                .localField("watchPartyIdString")
                .foreignField("watchPartyId")
                .as("feedbacks");

        // 4) unwind feedbacks so comment/sentiment search works
        UnwindOperation unwindFeedbacks = Aggregation.unwind("feedbacks", true);

        AggregationOperation addHostUsername = context -> new Document("$addFields",
                new Document("hostUsername",
                        new Document("$ifNull", List.of(
                                new Document("$arrayElemAt", List.of("$hostUsers.username", 0)),
                                "Unknown Host"
                        ))
                )
        );

        AggregationOperation addCounts = context -> new Document("$addFields",
                new Document("participantCount",
                        new Document("$size",
                                new Document("$ifNull", List.of("$participantIds", List.of()))
                        )
                )
        );

        MatchOperation matchOperation = Aggregation.match(
                new org.springframework.data.mongodb.core.query.Criteria().orOperator(
                        org.springframework.data.mongodb.core.query.Criteria.where("titre").regex(regex),
                        org.springframework.data.mongodb.core.query.Criteria.where("statut").regex(regex),
                        org.springframework.data.mongodb.core.query.Criteria.where("hostUsername").regex(regex),
                        org.springframework.data.mongodb.core.query.Criteria.where("feedbacks.commentaire").regex(regex),
                        org.springframework.data.mongodb.core.query.Criteria.where("feedbacks.sentiment").regex(regex)
                )
        );

        AggregationOperation addMatchedFields = context -> new Document("$addFields",
                new Document("matchedFeedbackComment",
                        new Document("$ifNull", List.of("$feedbacks.commentaire", ""))
                ).append("matchedSentiment",
                        new Document("$ifNull", List.of("$feedbacks.sentiment", ""))
                )
        );

        GroupOperation groupByWatchParty = Aggregation.group("_id")
                .first("_id").as("watchPartyId")
                .first("titre").as("titre")
                .first("statut").as("statut")
                .first("clientId").as("hostId")
                .first("hostUsername").as("hostUsername")
                .first("participantCount").as("participantCount")
                .first("matchedFeedbackComment").as("matchedFeedbackComment")
                .first("matchedSentiment").as("matchedSentiment")
                .count().as("feedbackCount");

        ProjectionOperation project = Aggregation.project()
                .andExpression("watchPartyId").as("watchPartyId")
                .andExpression("titre").as("titre")
                .andExpression("statut").as("statut")
                .andExpression("hostId").as("hostId")
                .andExpression("hostUsername").as("hostUsername")
                .andExpression("participantCount").as("participantCount")
                .andExpression("feedbackCount").as("feedbackCount")
                .andExpression("matchedFeedbackComment").as("matchedFeedbackComment")
                .andExpression("matchedSentiment").as("matchedSentiment");

        SortOperation sortByTitle = Aggregation.sort(Sort.by(Sort.Direction.ASC, "titre"));

        Aggregation aggregation = Aggregation.newAggregation(
                lookupUsers,
                addWatchPartyIdString,
                lookupFeedbacks,
                unwindFeedbacks,
                addHostUsername,
                addCounts,
                matchOperation,
                addMatchedFields,
                groupByWatchParty,
                project,
                sortByTitle
        );

        AggregationResults<WatchPartySearchResultDTO> results =
                mongoTemplate.aggregate(aggregation, "watchparties", WatchPartySearchResultDTO.class);

        return results.getMappedResults();
    }
}