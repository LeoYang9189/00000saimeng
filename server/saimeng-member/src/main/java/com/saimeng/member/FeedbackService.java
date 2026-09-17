package com.saimeng.member;

import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.common.BusinessException;
import com.saimeng.member.entity.MemberFeedbackEntity;
import com.saimeng.member.mapper.MemberFeedbackMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 前台反馈服务。
 */
@Service
public class FeedbackService {

    private static final Set<String> ALLOWED_FEEDBACK_TYPES = Set.of("CONSULTATION", "SUGGESTION", "COMPLAINT");

    private final MemberFeedbackMapper memberFeedbackMapper;
    private final ObjectMapper objectMapper;

    public FeedbackService(MemberFeedbackMapper memberFeedbackMapper, ObjectMapper objectMapper) {
        this.memberFeedbackMapper = memberFeedbackMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * 提交反馈。
     *
     * @param userId 登录用户 ID，可为空
     * @param feedbackType 反馈类型
     * @param relatedOrderNo 关联订单号
     * @param content 问题描述
     * @param contact 联系方式
     * @param attachmentNames 截图文件名
     * @return 反馈记录
     */
    @Transactional
    public FeedbackRecord submit(
            Long userId,
            String feedbackType,
            String relatedOrderNo,
            String content,
            String contact,
            List<String> attachmentNames) {
        String normalizedFeedbackType = feedbackType == null ? "" : feedbackType.trim().toUpperCase();
        if (!ALLOWED_FEEDBACK_TYPES.contains(normalizedFeedbackType)) {
            throw new BusinessException("反馈类型不支持");
        }

        MemberFeedbackEntity entity = new MemberFeedbackEntity();
        entity.setId(IdWorker.getId());
        entity.setUserId(userId);
        entity.setFeedbackType(normalizedFeedbackType);
        entity.setRelatedOrderNo(normalizeNullableValue(relatedOrderNo));
        entity.setContent(content.trim());
        entity.setContact(normalizeNullableValue(contact));
        entity.setAttachmentNamesJson(writeAttachmentNames(attachmentNames));
        entity.setStatus("SUBMITTED");
        entity.setSourceChannel("WEB_STORE");
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(entity.getCreatedAt());
        memberFeedbackMapper.insert(entity);
        return toRecord(entity);
    }

    private String normalizeNullableValue(String value) {
        if (value == null) {
            return null;
        }
        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private String writeAttachmentNames(List<String> attachmentNames) {
        try {
            return objectMapper.writeValueAsString(attachmentNames == null ? List.of() : attachmentNames);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("反馈附件保存失败");
        }
    }

    private List<String> readAttachmentNames(String attachmentNamesJson) {
        if (attachmentNamesJson == null || attachmentNamesJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readerForListOf(String.class).readValue(attachmentNamesJson);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("反馈附件读取失败");
        }
    }

    private FeedbackRecord toRecord(MemberFeedbackEntity entity) {
        return new FeedbackRecord(
                entity.getId(),
                entity.getUserId(),
                entity.getFeedbackType(),
                entity.getRelatedOrderNo(),
                entity.getContent(),
                entity.getContact(),
                readAttachmentNames(entity.getAttachmentNamesJson()),
                entity.getStatus(),
                entity.getSourceChannel(),
                entity.getCreatedAt());
    }

    public record FeedbackRecord(
            Long feedbackId,
            Long userId,
            String feedbackType,
            String relatedOrderNo,
            String content,
            String contact,
            List<String> attachmentNames,
            String status,
            String sourceChannel,
            LocalDateTime createdAt) {
    }
}
