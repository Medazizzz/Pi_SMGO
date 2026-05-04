package com.example.contentmanagement.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "promotions")
@Getter @Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@ToString @AllArgsConstructor @NoArgsConstructor
public class Promotion {

    @Id
    String id;

    String code;
    double pourcentageReduction;
    Date dateExpiration;
    String clientId;       // null = promo globale, non-null = promo ciblée

    boolean active = true; // ✅ Ajout pour US-P06
}
