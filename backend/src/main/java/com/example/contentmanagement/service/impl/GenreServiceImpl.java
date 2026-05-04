package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.GenreDTO;
import com.example.contentmanagement.entity.Genre;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.GenreRepository;
import com.example.contentmanagement.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {

    private final GenreRepository genreRepository;

    @Override
    @Transactional
    public GenreDTO createGenre(GenreDTO genreDTO) {
        Genre genre = new Genre();
        genre.setName(genreDTO.getName());
        genre.setDescription(genreDTO.getDescription());
        genre.setColor(genreDTO.getColor());

        Genre savedGenre = genreRepository.save(genre);
        return mapToDTO(savedGenre);
    }

    @Override
    public GenreDTO getGenreById(String id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + id));
        return mapToDTO(genre);
    }

    @Override
    public List<GenreDTO> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GenreDTO updateGenre(String id, GenreDTO genreDTO) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + id));

        genre.setName(genreDTO.getName());
        genre.setDescription(genreDTO.getDescription());
        genre.setColor(genreDTO.getColor());

        Genre updatedGenre = genreRepository.save(genre);
        return mapToDTO(updatedGenre);
    }

    @Override
    @Transactional
    public void deleteGenre(String id) {
        if (!genreRepository.existsById(id)) {
            throw new ResourceNotFoundException("Genre not found: " + id);
        }
        genreRepository.deleteById(id);
    }

    private GenreDTO mapToDTO(Genre genre) {
        return GenreDTO.builder()
                .id(genre.getId())
                .name(genre.getName())
                .description(genre.getDescription())
                .color(genre.getColor())
                .build();
    }
}
