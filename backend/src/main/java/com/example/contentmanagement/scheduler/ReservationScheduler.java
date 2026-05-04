package com.example.contentmanagement.scheduler;

import com.example.contentmanagement.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReservationScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReservationScheduler.class);
    private final ReservationService reservationService;

    @Scheduled(cron = "0 * * * * *")
    public void runReservationExpirationTask() {
        LOGGER.info("Starting reservation expiration scheduler task...");
        try {
            reservationService.processExpiredReservations();
            LOGGER.info("Reservation expiration scheduler task completed.");
        } catch (Exception ex) {
            LOGGER.error("Reservation expiration scheduler task failed.", ex);
        }
    }
}
