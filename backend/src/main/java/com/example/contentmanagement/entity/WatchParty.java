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

@Document(collection = "watchparties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchParty {

    @Id
    private String id;

    private String titre;
    private Date dateCreation;
    private String statut;

    private String clientId;
    private String adminId;
    private String contenuId;

    @Builder.Default
    private List<String> reservationIds = new ArrayList<>();

    @Builder.Default
    private List<String> participantIds = new ArrayList<>();
}
