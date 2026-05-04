package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Reservation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Aggregation;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends MongoRepository<Reservation, String> {
    List<Reservation> findByUserId(String userId);
    List<Reservation> findBySeanceId(String seanceId);
    Optional<Reservation> findBySeanceIdAndNumeroPlace(String seanceId, String numeroPlace);
    List<Reservation> findByPaymentSessionId(String paymentSessionId);
    List<Reservation> findByStatutAndExpiresAtBefore(String statut, Date expiresAt);

    @Query("{ $or: [ " +
           "  { 'userId': { $regex: ?0, $options: 'i' } }, " +
           "  { 'numeroPlace': { $regex: ?0, $options: 'i' } }, " +
           "  { 'statut': { $regex: ?0, $options: 'i' } }, " +
           "  { 'contenuId': { $regex: ?0, $options: 'i' } } " +
           "] }")
    List<Reservation> findByKeyword(String keyword);

    @Aggregation(pipeline = {
        "{ $lookup: { from: 'seances', localField: 'seanceId', foreignField: '_id', as: 'seance' } }",
        "{ $unwind: { path: '$seance', preserveNullAndEmptyArrays: true } }",
        "{ $lookup: { from: 'cinemas', localField: 'seance.cinemaId', foreignField: '_id', as: 'cinema' } }",
        "{ $unwind: { path: '$cinema', preserveNullAndEmptyArrays: true } }",
        "{ $lookup: { from: 'salles', localField: 'seance.salle', foreignField: '_id', as: 'salle' } }",
        "{ $unwind: { path: '$salle', preserveNullAndEmptyArrays: true } }",
        "{ $match: { $or: [ " +
        "  { 'userId': { $regex: ?0, $options: 'i' } }, " +
        "  { 'numeroPlace': { $regex: ?0, $options: 'i' } }, " +
        "  { 'statut': { $regex: ?0, $options: 'i' } }, " +
        "  { 'contenuId': { $regex: ?0, $options: 'i' } }, " +
        "  { 'seance.contenuId': { $regex: ?0, $options: 'i' } }, " +
        "  { 'cinema.nom': { $regex: ?0, $options: 'i' } }, " +
        "  { 'cinema.adresse': { $regex: ?0, $options: 'i' } }, " +
        "  { 'cinema.ville': { $regex: ?0, $options: 'i' } }, " +
        "  { 'salle.name': { $regex: ?0, $options: 'i' } } " +
        "] } }",
        "{ $project: { 'seance': 0, 'cinema': 0, 'salle': 0 } }"
    })
    List<Reservation> findReservationsWithDetailsByKeyword(String keyword);
}
