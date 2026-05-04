package com.example.contentmanagement.service.Scheduler;

import com.example.contentmanagement.entity.WatchParty;
import com.example.contentmanagement.repository.WatchPartyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class WatchPartySchedulerServiceImpl {

    private final WatchPartyRepository watchPartyRepository;

    /**
     * Runs every hour.
     * Closes watch parties that are still OPEN after 24 hours from creation.
     */
    @Scheduled(fixedRate = 3600000) // every 1 hour
    public void closeExpiredWatchParties() {
        Date now = new Date();

        long twentyFourHoursMillis = TimeUnit.HOURS.toMillis(24);
        Date limitDate = new Date(now.getTime() - twentyFourHoursMillis);

        List<WatchParty> expiredWatchParties =
                watchPartyRepository.findByStatutAndDateCreationBefore("OPEN", limitDate);

        if (expiredWatchParties.isEmpty()) {
            log.info("Scheduler: no expired OPEN watchparties found.");
            return;
        }

        for (WatchParty watchParty : expiredWatchParties) {
            watchParty.setStatut("CLOSED");
            watchParty.setUpdatedAt(now);
            watchPartyRepository.save(watchParty);

            log.info("Scheduler: watchparty [{}] closed automatically.", watchParty.getId());
        }

        log.info("Scheduler finished: {} watchparty(s) closed.", expiredWatchParties.size());
    }
}