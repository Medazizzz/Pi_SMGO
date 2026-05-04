package test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.contentmanagement.dto.GenreDTO;
import com.example.contentmanagement.entity.Genre;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.GenreRepository;
import com.example.contentmanagement.service.impl.GenreServiceImpl;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GenreServiceImplTest {

    @Mock
    private GenreRepository genreRepository;

    @InjectMocks
    private GenreServiceImpl genreService;

    @Test
    void createGenre_mapsFieldsAndReturnsSavedGenre() {
        GenreDTO input = GenreDTO.builder()
                .name("Thriller")
                .description("Thriller content")
                .color("#ff0000")
                .build();

        when(genreRepository.save(any(Genre.class))).thenAnswer(invocation -> {
            Genre genre = invocation.getArgument(0);
            genre.setId("genre-1");
            return genre;
        });

        GenreDTO result = genreService.createGenre(input);

        assertEquals("genre-1", result.getId());
        assertEquals("Thriller", result.getName());
        assertEquals("#ff0000", result.getColor());
    }

    @Test
    void getGenreById_throwsWhenNotFound() {
        when(genreRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> genreService.getGenreById("missing"));
    }

    @Test
    void deleteGenre_deletesWhenGenreExists() {
        when(genreRepository.existsById("genre-2")).thenReturn(true);

        genreService.deleteGenre("genre-2");

        verify(genreRepository).deleteById("genre-2");
    }
}
