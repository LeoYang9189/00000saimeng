package com.saimeng.admin.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

/**
 * 会员等级配置实体。
 */
@TableName("member_level_config")
public class MemberLevelConfigEntity {

    @TableId
    private Long id;
    private String levelKey;
    private String levelName;
    private Integer levelRank;
    private String levelTitle;
    private String levelDescription;
    private String summaryText;
    private String progressText;
    private String missionText;
    private String missionAction;
    private String highlightTitle;
    private String visualSrc;
    private String heroStart;
    private String heroMid;
    private String heroEnd;
    private String accent;
    private String softAccent;
    private String cardSurface;
    private String placeholderTone;
    private String glowColor;
    private String sparkColor;
    private Integer progressPercent;
    private String highlightKeys;
    private String benefitKeys;
    private Boolean enabled;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getLevelKey() { return levelKey; }
    public void setLevelKey(String levelKey) { this.levelKey = levelKey; }
    public String getLevelName() { return levelName; }
    public void setLevelName(String levelName) { this.levelName = levelName; }
    public Integer getLevelRank() { return levelRank; }
    public void setLevelRank(Integer levelRank) { this.levelRank = levelRank; }
    public String getLevelTitle() { return levelTitle; }
    public void setLevelTitle(String levelTitle) { this.levelTitle = levelTitle; }
    public String getLevelDescription() { return levelDescription; }
    public void setLevelDescription(String levelDescription) { this.levelDescription = levelDescription; }
    public String getSummaryText() { return summaryText; }
    public void setSummaryText(String summaryText) { this.summaryText = summaryText; }
    public String getProgressText() { return progressText; }
    public void setProgressText(String progressText) { this.progressText = progressText; }
    public String getMissionText() { return missionText; }
    public void setMissionText(String missionText) { this.missionText = missionText; }
    public String getMissionAction() { return missionAction; }
    public void setMissionAction(String missionAction) { this.missionAction = missionAction; }
    public String getHighlightTitle() { return highlightTitle; }
    public void setHighlightTitle(String highlightTitle) { this.highlightTitle = highlightTitle; }
    public String getVisualSrc() { return visualSrc; }
    public void setVisualSrc(String visualSrc) { this.visualSrc = visualSrc; }
    public String getHeroStart() { return heroStart; }
    public void setHeroStart(String heroStart) { this.heroStart = heroStart; }
    public String getHeroMid() { return heroMid; }
    public void setHeroMid(String heroMid) { this.heroMid = heroMid; }
    public String getHeroEnd() { return heroEnd; }
    public void setHeroEnd(String heroEnd) { this.heroEnd = heroEnd; }
    public String getAccent() { return accent; }
    public void setAccent(String accent) { this.accent = accent; }
    public String getSoftAccent() { return softAccent; }
    public void setSoftAccent(String softAccent) { this.softAccent = softAccent; }
    public String getCardSurface() { return cardSurface; }
    public void setCardSurface(String cardSurface) { this.cardSurface = cardSurface; }
    public String getPlaceholderTone() { return placeholderTone; }
    public void setPlaceholderTone(String placeholderTone) { this.placeholderTone = placeholderTone; }
    public String getGlowColor() { return glowColor; }
    public void setGlowColor(String glowColor) { this.glowColor = glowColor; }
    public String getSparkColor() { return sparkColor; }
    public void setSparkColor(String sparkColor) { this.sparkColor = sparkColor; }
    public Integer getProgressPercent() { return progressPercent; }
    public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }
    public String getHighlightKeys() { return highlightKeys; }
    public void setHighlightKeys(String highlightKeys) { this.highlightKeys = highlightKeys; }
    public String getBenefitKeys() { return benefitKeys; }
    public void setBenefitKeys(String benefitKeys) { this.benefitKeys = benefitKeys; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
