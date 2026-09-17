package com.saimeng.ai;

import java.util.List;

/** Implement with the supplied Lovart integration; the app never invents a provider API. */
public interface MaterialImageGenerator {
    boolean isReady();
    ImageResult generate(ImageRequest request);

    record ImageRequest(String productId, String productName, List<String> referenceImages,
                        int width, int height, String prompt) { }
    record ImageResult(String status, String message, List<String> imageUrls, ImageRequest request) { }
}
