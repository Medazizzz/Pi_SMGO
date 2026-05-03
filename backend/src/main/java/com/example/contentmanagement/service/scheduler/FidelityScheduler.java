package com.example.contentmanagement.service.scheduler;

import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.AbonnementRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.fidelity.FidelityScoreService;
import com.example.contentmanagement.service.fidelity.LoyaltyLevelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FidelityScheduler {

    private final UserRepository userRepo;
    private final AbonnementRepository abonnementRepo;
    private final FidelityScoreService scoreService;
    private final LoyaltyLevelService levelService;

    @Scheduled(fixedRate = 60000)
    public void updateUsers() {
        List<User> users = userRepo.findAll();
        log.info("🔄 Scheduler démarré — {} utilisateur(s) à traiter", users.size());

        for (User user : users) {
            try {
                // ✅ Récupération des abonnements
                List<Abonnement> abonnements = abonnementRepo.findByUserId(user.getId());

                // ✅ Log de diagnostic — indispensable pour déboguer
                log.info("👤 User [{}] | Abonnements trouvés : {} | Montants : {}",
                        user.getId(),
                        abonnements.size(),
                        abonnements.stream().map(Abonnement::getAmount).toList()
                );

                // ✅ Calcul du score
                double score = scoreService.calculateScore(user, abonnements);

                // ✅ Détermination du niveau
                String level = levelService.getLevel(score);

                // ✅ Mise à jour et sauvegarde
                user.setFidelityScore(score);
                user.setFidelityLevel(level);
                userRepo.save(user);

                log.info("✅ User [{}] mis à jour — score: {} | level: {}", user.getId(), score, level);

            } catch (Exception e) {
                // ✅ Try/catch par utilisateur — une erreur n'arrête pas les autres
                log.error("❌ Erreur lors du traitement du user [{}] : {}", user.getId(), e.getMessage(), e);
            }
        }

        log.info("✅ Scheduler terminé !");
    }
}