package test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.contentmanagement.dto.FilmDTO;
import com.example.contentmanagement.entity.ContentCategory;
import com.example.contentmanagement.entity.Film;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.ContentRepository;
import com.example.contentmanagement.repository.DocumentaryRepository;
import com.example.contentmanagement.repository.FilmRepository;
import com.example.contentmanagement.repository.SeriesRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.impl.ContentServiceImpl;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ContentServiceImplTest {

    @Mock
    private ContentRepository contentRepository;

    @Mock
    private FilmRepository filmRepository;

    @Mock
    private SeriesRepository seriesRepository;

    @Mock
    private DocumentaryRepository documentaryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ContentServiceImpl contentService;

    @Test
    void createFilm_createsAnonymousUserAndSavesFilm() {
        FilmDTO filmDTO = FilmDTO.builder()
                .director("Test Director")
                .durationInMinutes(120)
                .build();
        filmDTO.setTitle("Sample Film");
        filmDTO.setDescription("Description");
        filmDTO.setCategory(ContentCategory.MOVIE);

        when(userRepository.findByUsername("anonymous")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-1");
            return user;
        });

        when(filmRepository.save(any(Film.class))).thenAnswer(invocation -> {
            Film film = invocation.getArgument(0);
            film.setId("film-1");
            return film;
        });

        FilmDTO result = contentService.createFilm(filmDTO, "anonymous");

        assertEquals("film-1", result.getId());
        assertEquals("FILM", result.getContentType());
        assertEquals("Test Director", result.getDirector());
        assertEquals("user-1", result.getAddedById());
    }

    @Test
    void deleteContent_throwsWhenContentNotFound() {
        when(filmRepository.existsById("missing-id")).thenReturn(false);
        when(seriesRepository.existsById("missing-id")).thenReturn(false);
        when(documentaryRepository.existsById("missing-id")).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> contentService.deleteContent("missing-id"));

        verify(filmRepository, never()).deleteById("missing-id");
        verify(seriesRepository, never()).deleteById("missing-id");
        verify(documentaryRepository, never()).deleteById("missing-id");
    }
}
