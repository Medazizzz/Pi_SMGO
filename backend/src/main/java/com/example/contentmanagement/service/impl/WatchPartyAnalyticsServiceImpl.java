package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.WatchPartyAnalyticsDTO;
import com.example.contentmanagement.service.WatchPartyAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WatchPartyAnalyticsServiceImpl implements WatchPartyAnalyticsService {

    private final MongoTemplate mongoTemplate;

    @Override
    public List<WatchPartyAnalyticsDTO> getWatchPartyAnalytics() {

        LookupOperation lookupFeedbacks = LookupOperation.newLookup()
                .from("feedbacks")
                .localField("_id")
                .foreignField("watchPartyId")
                .as("feedbacks");

        LookupOperation lookupUsers = LookupOperation.newLookup()
                .from("users")
                .localField("clientId")
                .foreignField("username")
                .as("hostUsers");

        AddFieldsOperation addParticipantCount = AddFieldsOperation.builder()
                .addField("participantCount")
                .withValue(
                        ConditionalOperators.ifNull("participantIds")
                                .then(new ArrayList<>())
                )
                .build();

        AggregationOperation computeParticipantSize = context -> new Document("$addFields",
                new Document("participantCount",
                        new Document("$size",
                                new Document("$ifNull", List.of("$participantIds", List.of()))
                        )
                )
        );

        AggregationOperation computeFeedbackStats = context -> new Document("$addFields",
                new Document("feedbackCount",
                        new Document("$size",
                                new Document("$ifNull", List.of("$feedbacks", List.of()))
                        )
                )
                        .append("averageRating",
                                new Document("$cond", List.of(
                                        new Document("$gt", List.of(
                                                new Document("$size", new Document("$ifNull", List.of("$feedbacks", List.of()))),
                                                0
                                        )),
                                        new Document("$avg", "$feedbacks.note"),
                                        0
                                )))
                        .append("positiveFeedbackCount",
                                new Document("$size",
                                        new Document("$filter",
                                                new Document("input", new Document("$ifNull", List.of("$feedbacks", List.of())))
                                                        .append("as", "fb")
                                                        .append("cond", new Document("$eq", List.of("$$fb.sentiment", "positive")))
                                        )
                                )
                        )
                        .append("negativeFeedbackCount",
                                new Document("$size",
                                        new Document("$filter",
                                                new Document("input", new Document("$ifNull", List.of("$feedbacks", List.of())))
                                                        .append("as", "fb")
                                                        .append("cond", new Document("$eq", List.of("$$fb.sentiment", "negative")))
                                        )
                                )
                        )
        );

        AggregationOperation extractHostUsername = context -> new Document("$addFields",
                new Document("hostUsername",
                        new Document("$ifNull", List.of(
                                new Document("$arrayElemAt", List.of("$hostUsers.username", 0)),
                                "Unknown Host"
                        ))
                )
        );

        AggregationOperation computeGlobalScore = context -> new Document("$addFields",
                new Document("globalScore",
                        new Document("$add", List.of(
                                new Document("$multiply", List.of("$participantCount", 2)),
                                new Document("$multiply", List.of("$averageRating", 10)),
                                new Document("$multiply", List.of("$positiveFeedbackCount", 3)),
                                new Document("$multiply", List.of("$negativeFeedbackCount", -2))
                        ))
                )
        );

        ProjectionOperation projectFields = Aggregation.project()
                .andExpression("_id").as("watchPartyId")
                .andExpression("titre").as("titre")
                .andExpression("statut").as("statut")
                .andExpression("dateCreation").as("dateCreation")
                .andExpression("clientId").as("hostId")
                .andExpression("hostUsername").as("hostUsername")
                .andExpression("participantCount").as("participantCount")
                .andExpression("feedbackCount").as("feedbackCount")
                .andExpression("averageRating").as("averageRating")
                .andExpression("positiveFeedbackCount").as("positiveFeedbackCount")
                .andExpression("negativeFeedbackCount").as("negativeFeedbackCount")
                .andExpression("globalScore").as("globalScore");

        SortOperation sortByScoreDesc = Aggregation.sort(Sort.by(Sort.Direction.DESC, "globalScore"));

        Aggregation aggregation = Aggregation.newAggregation(
                lookupFeedbacks,
                lookupUsers,
                computeParticipantSize,
                computeFeedbackStats,
                extractHostUsername,
                computeGlobalScore,
                projectFields,
                sortByScoreDesc
        );

        AggregationResults<WatchPartyAnalyticsDTO> results =
                mongoTemplate.aggregate(aggregation, "watchparties", WatchPartyAnalyticsDTO.class);

        return results.getMappedResults();
    }
}