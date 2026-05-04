package test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.contentmanagement.dto.NotificationDTO;
import com.example.contentmanagement.entity.Notification;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.NotificationRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.impl.NotificationServiceImpl;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    void createNotification_createsFallbackUserAndReturnsDto() {
        NotificationDTO input = NotificationDTO.builder()
                .message("System info")
                .type("INFO")
                .userId("ghost-user")
                .build();

        when(userRepository.findById("ghost-user")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-42");
            return user;
        });

        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification notification = invocation.getArgument(0);
            notification.setId("notif-1");
            return notification;
        });

        NotificationDTO result = notificationService.createNotification(input);

        assertEquals("notif-1", result.getId());
        assertEquals("user-42", result.getUserId());
        assertEquals("INFO", result.getType());
        assertEquals(false, result.getIsRead());
        assertNotNull(result.getCreatedAt());
    }

    @Test
    void markAsRead_updatesNotificationStatus() {
        Notification notification = Notification.builder()
                .id("n-1")
                .message("test")
                .type("INFO")
                .user(User.builder().id("u-1").username("u1").email("u1@test.local").password("").build())
                .isRead(false)
                .build();

        when(notificationRepository.findById("n-1")).thenReturn(Optional.of(notification));

        notificationService.markAsRead("n-1");

        assertEquals(true, notification.getIsRead());
        verify(notificationRepository).save(notification);
    }
}
