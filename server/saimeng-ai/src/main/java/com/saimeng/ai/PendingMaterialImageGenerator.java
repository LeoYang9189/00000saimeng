package com.saimeng.ai;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PendingMaterialImageGenerator implements MaterialImageGenerator {
    @Override
    public boolean isReady() { return false; }

    @Override
    public ImageResult generate(ImageRequest request) {
        return new ImageResult("WAITING_FOR_PROVIDER", "图片生成暂未开通，创作需求已保留。",
                List.of(), request);
    }
}
