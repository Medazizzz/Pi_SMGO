package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Post;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {

    // ✅ Aggregation 1 — Posts avec compteur de commentaires
    @Aggregation(pipeline = {
            "{ $lookup: { " +
                    "from: 'commentaires', " +
                    "let: { postId: { $toString: '$_id' } }, " +
                    "pipeline: [ " +
                    "{ $match: { $expr: { $eq: ['$postId', '$$postId'] } } } " +
                    "], " +
                    "as: 'comments' " +
                    "} }",
            "{ $addFields: { commentCount: { $size: '$comments' } } }",
            "{ $sort: { commentCount: -1 } }"
    })
    List<Post> findPostsWithCommentCount();

    // ✅ Aggregation 2 — For You Page avec score d'engagement
    @Aggregation(pipeline = {
            "{ $lookup: { " +
                    "from: 'commentaires', " +
                    "let: { postId: { $toString: '$_id' } }, " +
                    "pipeline: [ " +
                    "{ $match: { $expr: { $eq: ['$postId', '$$postId'] } } } " +
                    "], " +
                    "as: 'comments' " +
                    "} }",

            "{ $addFields: { " +
                    "commentCount: { $size: '$comments' }, " +
                    "totalReactions: { " +
                    "   $sum: { " +
                    "       $map: { " +
                    "           input: { $filter: { " +
                    "               input: { $objectToArray: { $ifNull: ['$reactions', {}] } }, " +
                    "               as: 'item', " +
                    "               cond: { $gt: [ { $size: '$$item.v' }, 0 ] } " +
                    "           }}, " +
                    "           as: 'r', " +
                    "           in: { $size: '$$r.v' } " +
                    "       } " +
                    "   } " +
                    "}, " +
                    "vuesCount: { $size: { $ifNull: ['$viewedBy', []] } } " +
                    "} }",

            "{ $addFields: { " +
                    "forYouScore: { " +
                    "   $add: [ " +
                    "       { $multiply: ['$totalReactions', 3] }, " +
                    "       { $multiply: ['$commentCount', 2] }, " +
                    "       { $multiply: ['$vuesCount', 1] } " +
                    "   ] " +
                    "} } }",

            "{ $sort: { forYouScore: -1 } }",
            // ✅ Exclure les posts sans aucune interaction

            "{ $match: { forYouScore: { $gt: 0 } } }"

    })
    List<Post> findPostsForYouPage();
}