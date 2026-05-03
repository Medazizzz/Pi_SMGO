package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.repository.AbonnementRepository;
import com.example.contentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DunningManager {

    private final AbonnementRepository abonnementRepository;
    private final UserRepository       userRepository;
    private final JavaMailSender       mailSender;

    public void processDunning(Abonnement abonnement) {
        long daysLeft = abonnement.getDaysUntilExpiration();

        if (daysLeft <= 1 && !abonnement.isDunningJ1Sent()) {
            sendEmail(abonnement, "J-1",
                    "⚠️ Votre abonnement se renouvelle demain !",
                    buildJ1Message(abonnement));
            abonnement.setDunningJ1Sent(true);
            abonnementRepository.save(abonnement);

        } else if (daysLeft <= 7 && !abonnement.isDunningJ7Sent()) {
            sendEmail(abonnement, "J-7",
                    "🔔 Mettez à jour votre moyen de paiement",
                    buildJ7Message(abonnement));
            abonnement.setDunningJ7Sent(true);
            abonnementRepository.save(abonnement);

        } else if (daysLeft <= 15 && !abonnement.isDunningJ15Sent()) {
            sendEmail(abonnement, "J-15",
                    "💡 Notre recommandation personnalisée pour vous",
                    buildJ15Message(abonnement));
            abonnement.setDunningJ15Sent(true);
            abonnementRepository.save(abonnement);

        } else if (daysLeft <= 30 && !abonnement.isDunningJ30Sent()) {
            sendEmail(abonnement, "J-30",
                    "📅 Votre abonnement se renouvelle bientôt",
                    buildJ30Message(abonnement));
            abonnement.setDunningJ30Sent(true);
            abonnementRepository.save(abonnement);
        }
    }

    // ================================================================
    // CONSTRUCTION DES MESSAGES
    // ================================================================
    private String buildJ30Message(Abonnement abonnement) {
        return String.format(
                "Bonjour,\n\nVotre abonnement %s se renouvelle dans 30 jours.\n" +
                        "Score de fidélité actuel : %.0f pts\n\n" +
                        "Merci de votre confiance !\n\nL'équipe ShowMatchGoOn",
                abonnement.getType(), abonnement.getRenewalScore()
        );
    }

    private String buildJ15Message(Abonnement abonnement) {
        String offer = abonnement.getRenewalScore() < 50
                ? "🎁 Offre spéciale : -20% sur votre prochain renouvellement !"
                : "Votre plan actuel vous convient parfaitement.";
        return String.format(
                "Bonjour,\n\nVotre renouvellement approche dans 15 jours.\n\n" +
                        "%s\n\nDécision recommandée : %s\n\n" +
                        "Connectez-vous pour voir notre recommandation IA.\n\nL'équipe ShowMatchGoOn",
                offer, abonnement.getRenewalDecision()
        );
    }

    private String buildJ7Message(Abonnement abonnement) {
        return String.format(
                "Bonjour,\n\nPlus que 7 jours avant le renouvellement de votre abonnement %s.\n\n" +
                        "Vérifiez que votre carte bancaire est à jour pour éviter toute interruption.\n\n" +
                        "Prix du renouvellement : %.2f DT\n\nL'équipe ShowMatchGoOn",
                abonnement.getType(), abonnement.getPrix()
        );
    }

    private String buildJ1Message(Abonnement abonnement) {
        return String.format(
                "Bonjour,\n\nDemain, votre abonnement %s sera automatiquement renouvelé.\n\n" +
                        "Montant : %.2f DT\n" +
                        "Si vous souhaitez annuler, faites-le avant minuit.\n\n" +
                        "Merci !\n\nL'équipe ShowMatchGoOn",
                abonnement.getType(), abonnement.getPrix()
        );
    }

    // ================================================================
    // ENVOI EMAIL — JavaMailSender branché
    // ================================================================
    private void sendEmail(Abonnement abonnement,
                           String stage,
                           String subject,
                           String body) {
        try {
            // Récupérer l'email de l'utilisateur depuis MongoDB
            String userEmail = userRepository.findById(abonnement.getUserId())
                    .map(u -> u.getEmail())
                    .orElse(null);

            if (userEmail == null) {
                log.warn("[Dunning][{}] Email introuvable pour userId={}",
                        stage, abonnement.getUserId());
                return;
            }

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom("votre.email@gmail.com"); // ← remplacez par votre email
            mail.setTo(userEmail);
            mail.setSubject(subject);
            mail.setText(body);

            mailSender.send(mail);

            log.info("[Dunning][{}] ✅ Email envoyé → {} | subject={}",
                    stage, userEmail, subject);

        } catch (Exception e) {
            log.error("[Dunning][{}] ❌ Échec envoi email userId={} : {}",
                    stage, abonnement.getUserId(), e.getMessage());
        }
    }
}