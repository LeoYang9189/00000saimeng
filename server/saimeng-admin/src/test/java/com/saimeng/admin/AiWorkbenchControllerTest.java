package com.saimeng.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.ai.AiWorkbenchService;
import com.saimeng.common.BusinessException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AiWorkbenchControllerTest {
    private final AiWorkbenchService ai = mock(AiWorkbenchService.class);
    private final OperatorCatalogService catalog = mock(OperatorCatalogService.class);
    private final OperatorCatalogService.ProductRecord product = mock(OperatorCatalogService.ProductRecord.class);
    private final AiWorkbenchController controller = new AiWorkbenchController(ai, catalog, new ObjectMapper());
    private final AiWorkbenchController.MaterialRequest request =
            new AiWorkbenchController.MaterialRequest(4003L, "LANDSCAPE", "MINIMAL", "");

    private void productWithMainImage(String image) {
        when(catalog.getProduct(4003L)).thenReturn(product);
        when(product.enabled()).thenReturn(true);
        when(product.auditStatus()).thenReturn("APPROVED");
        when(product.id()).thenReturn("4003");
        when(product.mainImage()).thenReturn(image);
        when(product.galleryImages()).thenReturn(List.of("/home/unrelated.png"));
    }

    @Test void usesOnlySelectedProductMainImage() {
        productWithMainImage(" /home/main.png ");
        controller.materials(request);
        var facts = ArgumentCaptor.forClass(AiWorkbenchService.ProductFacts.class);
        verify(ai).createMaterial(facts.capture(), eq("LANDSCAPE"), eq("MINIMAL"), eq(""));
        assertThat(facts.getValue().id()).isEqualTo("4003");
        assertThat(facts.getValue().referenceImages()).containsExactly("/home/main.png");
        verify(product, never()).galleryImages();
    }

    @Test void missingMainImageDoesNotFallBackToGalleryOrStartGeneration() {
        productWithMainImage(" ");
        assertThatThrownBy(() -> controller.materials(request)).isInstanceOf(BusinessException.class).hasMessageContaining("主图");
        assertThatThrownBy(() -> controller.streamMaterials(request)).isInstanceOf(BusinessException.class).hasMessageContaining("主图");
        verifyNoInteractions(ai);
    }
}
