package test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.contentmanagement.dto.CategoryDTO;
import com.example.contentmanagement.entity.Category;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.CategoryRepository;
import com.example.contentmanagement.service.impl.CategoryServiceImpl;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    void createCategory_defaultsContentTypeWhenMissing() {
        CategoryDTO input = CategoryDTO.builder()
                .name("Action")
                .description("Action movies")
                .contentType("")
                .build();

        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            category.setId("cat-1");
            return category;
        });

        CategoryDTO result = categoryService.createCategory(input);

        assertEquals("cat-1", result.getId());
        assertEquals("Action", result.getName());
        assertEquals("MOVIE", result.getContentType());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void deleteCategory_throwsWhenNotFound() {
        when(categoryRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.deleteCategory("missing"));
    }
}
