package com.example.contentmanagement.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document(collection = "feedbacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    private String id;

    private int note;
    private String commentaire;
    private Date dateFeedback;

    private String clientId;
    private String watchPartyId;

    @Builder.Default
    private int likes = 0;

    @Builder.Default
    private int dislikes = 0;

    @Builder.Default
    private List<String> likedByUserIds = new ArrayList<>();

    @Builder.Default
    private List<String> dislikedByUserIds = new ArrayList<>();
}
