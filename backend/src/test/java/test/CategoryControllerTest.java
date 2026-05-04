package test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.contentmanagement.controller.CategoryController;
import com.example.contentmanagement.dto.CategoryDTO;
import com.example.contentmanagement.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryController categoryController;

    @Test
    void createCategory_returnsCreatedResponse() {
        CategoryDTO input = CategoryDTO.builder()
                .name("Comedy")
                .description("Comedy category")
                .contentType("MOVIE")
                .build();

        CategoryDTO saved = CategoryDTO.builder()
                .id("cat-1")
                .name("Comedy")
                .description("Comedy category")
                .contentType("MOVIE")
                .build();

        when(categoryService.createCategory(input)).thenReturn(saved);

        ResponseEntity<CategoryDTO> response = categoryController.createCategory(input);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("cat-1", response.getBody().getId());
        verify(categoryService).createCategory(input);
    }
}
