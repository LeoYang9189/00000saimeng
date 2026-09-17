package com.saimeng.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.admin.entity.QuotationItemEntity;
import com.saimeng.admin.entity.QuotationSheetEntity;
import com.saimeng.admin.mapper.QuotationItemMapper;
import com.saimeng.admin.mapper.QuotationSheetMapper;
import com.saimeng.common.BusinessException;
import com.saimeng.product.entity.ProductSpuEntity;
import com.saimeng.product.mapper.ProductSpuMapper;
import com.saimeng.system.entity.SysUserEntity;
import com.saimeng.system.mapper.SysUserMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 运营后台报价单管理服务。
 */
@Service
public class OperatorQuotationService {

    private static final int TEMPLATE_DATA_START_ROW = 4;
    private static final TypeReference<QuotationItemSnapshot> SNAPSHOT_TYPE = new TypeReference<>() {
    };

    private final QuotationSheetMapper quotationSheetMapper;
    private final QuotationItemMapper quotationItemMapper;
    private final ProductSpuMapper productSpuMapper;
    private final SysUserMapper sysUserMapper;
    private final OperatorCatalogService operatorCatalogService;
    private final ObjectMapper objectMapper;

    public OperatorQuotationService(
            QuotationSheetMapper quotationSheetMapper,
            QuotationItemMapper quotationItemMapper,
            ProductSpuMapper productSpuMapper,
            SysUserMapper sysUserMapper,
            OperatorCatalogService operatorCatalogService,
            ObjectMapper objectMapper) {
        this.quotationSheetMapper = quotationSheetMapper;
        this.quotationItemMapper = quotationItemMapper;
        this.productSpuMapper = productSpuMapper;
        this.sysUserMapper = sysUserMapper;
        this.operatorCatalogService = operatorCatalogService;
        this.objectMapper = objectMapper;
    }

    public QuotationBootstrapPayload getBootstrap() {
        List<QuotationSheetEntity> quotations = quotationSheetMapper.selectList(new LambdaQueryWrapper<QuotationSheetEntity>()
                .eq(QuotationSheetEntity::getDeleted, false));
        Map<Long, List<QuotationItemEntity>> itemMap = listQuotationItemMap();
        Map<Long, String> operatorNameMap = listOperatorNameMap();
        List<QuotationRecord> quotationRecords = quotations.stream()
                .sorted(Comparator.comparing(QuotationSheetEntity::getUpdatedAt).reversed())
                .map(entity -> toQuotationRecord(entity, itemMap.getOrDefault(entity.getId(), List.of()), operatorNameMap))
                .toList();

        List<OperatorCatalogService.ProductRecord> products = operatorCatalogService.getBootstrap().products().stream()
                .filter(OperatorCatalogService.ProductRecord::enabled)
                .toList();
        return new QuotationBootstrapPayload(quotationRecords, products);
    }

    @Transactional
    public QuotationRecord createQuotation(Long operatorUserId, QuotationUpsertRequest request) {
        validateQuotationRequest(request);
        QuotationSheetEntity entity = new QuotationSheetEntity();
        entity.setId(IdWorker.getId());
        entity.setQuotationNo(generateQuotationNo());
        entity.setCreatedByUserId(operatorUserId);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setDeleted(false);
        applyQuotationValues(entity, request);
        quotationSheetMapper.insert(entity);
        replaceQuotationItems(entity.getId(), request.items());
        return getQuotation(entity.getId());
    }

    @Transactional
    public QuotationRecord updateQuotation(Long quotationId, QuotationUpsertRequest request) {
        validateQuotationRequest(request);
        QuotationSheetEntity entity = getRequiredQuotation(quotationId);
        applyQuotationValues(entity, request);
        entity.setUpdatedAt(LocalDateTime.now());
        quotationSheetMapper.updateById(entity);
        replaceQuotationItems(entity.getId(), request.items());
        return getQuotation(entity.getId());
    }

    public QuotationRecord getQuotation(Long quotationId) {
        QuotationSheetEntity entity = getRequiredQuotation(quotationId);
        List<QuotationItemEntity> itemEntities = listQuotationItems(quotationId);
        return toQuotationRecord(entity, itemEntities, listOperatorNameMap());
    }

    @Transactional
    public void deleteQuotation(Long quotationId) {
        QuotationSheetEntity entity = getRequiredQuotation(quotationId);
        entity.setDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
        quotationSheetMapper.updateById(entity);
    }

    @Transactional
    public ExportFile exportQuotation(Long quotationId) {
        QuotationSheetEntity entity = getRequiredQuotation(quotationId);
        List<QuotationItemEntity> itemEntities = listQuotationItems(quotationId);
        if (itemEntities.isEmpty()) {
            throw new BusinessException("报价单暂无商品，无法导出");
        }

        try (InputStream inputStream = Files.newInputStream(resolveTemplatePath());
             Workbook workbook = WorkbookFactory.create(inputStream);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.getSheetAt(0);
            Row templateRow = sheet.getRow(TEMPLATE_DATA_START_ROW);
            for (int index = 0; index < itemEntities.size(); index++) {
                QuotationItemSnapshot snapshot = readSnapshot(itemEntities.get(index).getSnapshotJson());
                int rowIndex = TEMPLATE_DATA_START_ROW + index;
                Row row = sheet.getRow(rowIndex);
                if (row == null) {
                    row = sheet.createRow(rowIndex);
                    cloneRowStyle(templateRow, row);
                }
                fillSnapshotRow(workbook, sheet, row, snapshot);
            }
            workbook.write(outputStream);

            entity.setLastExportedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            quotationSheetMapper.updateById(entity);
            return new ExportFile(entity.getQuotationNo() + ".xlsx", outputStream.toByteArray());
        } catch (Exception exception) {
            throw new BusinessException("报价单导出失败");
        }
    }

    private void validateQuotationRequest(QuotationUpsertRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new BusinessException("请至少选择一个商品");
        }
        request.items().forEach(item -> {
            if (item.quantity() == null || item.quantity() <= 0) {
                throw new BusinessException("商品数量必须大于 0");
            }
            ProductSpuEntity product = getRequiredProduct(item.parseProductId());
            if (!Boolean.TRUE.equals(product.getEnabled()) || Boolean.TRUE.equals(product.getDeleted())) {
                throw new BusinessException("存在不可用商品，无法加入报价单");
            }
        });
    }

    private void applyQuotationValues(QuotationSheetEntity entity, QuotationUpsertRequest request) {
        entity.setQuotationTitle(request.quotationTitle().trim());
        entity.setCustomerCompany(request.customerCompany().trim());
        entity.setCustomerName(request.customerName().trim());
        entity.setContactName(request.contactName().trim());
        entity.setContactPhone(request.contactPhone().trim());
        entity.setRemark(request.remark() == null ? "" : request.remark().trim());
        entity.setTotalProductCount(request.items().size());
        entity.setTotalQuantity(request.items().stream().mapToInt(QuotationItemUpsertRequest::quantity).sum());
    }

    private void replaceQuotationItems(Long quotationId, List<QuotationItemUpsertRequest> items) {
        quotationItemMapper.delete(new LambdaQueryWrapper<QuotationItemEntity>()
                .eq(QuotationItemEntity::getQuotationId, quotationId));
        for (int index = 0; index < items.size(); index++) {
            QuotationItemUpsertRequest itemRequest = items.get(index);
            ProductSpuEntity product = getRequiredProduct(itemRequest.parseProductId());
            QuotationItemEntity itemEntity = new QuotationItemEntity();
            itemEntity.setId(IdWorker.getId());
            itemEntity.setQuotationId(quotationId);
            itemEntity.setProductId(product.getId());
            itemEntity.setProductNameSnapshot(product.getProductName());
            itemEntity.setQuantity(itemRequest.quantity());
            itemEntity.setSortOrder(index + 1);
            itemEntity.setSnapshotJson(writeSnapshot(toSnapshot(product)));
            itemEntity.setCreatedAt(LocalDateTime.now());
            itemEntity.setUpdatedAt(LocalDateTime.now());
            quotationItemMapper.insert(itemEntity);
        }
    }

    private QuotationItemSnapshot toSnapshot(ProductSpuEntity product) {
        return new QuotationItemSnapshot(
                defaultString(product.getProductName()),
                defaultString(product.getProductCode()),
                defaultString(product.getBrandName()),
                defaultString(product.getOriginCountry()),
                defaultString(product.getMainImage()),
                defaultString(product.getBoxImage()),
                defaultString(product.getBarcode()),
                defaultString(product.getNetContent()),
                defaultString(product.getCaseSpec()),
                product.getPalletsPerContainer(),
                product.getCasesPerPallet(),
                product.getCasesPerContainer(),
                product.getShelfLifeMonths(),
                defaultString(product.getSizeCm()),
                defaultString(product.getGrossWeightKg()),
                defaultString(product.getIngredients()),
                product.getStockQuantity(),
                defaultDecimal(product.getMemberPriceBronze()),
                defaultDecimal(product.getMemberPriceSilver()),
                defaultDecimal(product.getMemberPriceGold()),
                defaultDecimal(product.getMemberPricePlatinum()),
                defaultDecimal(product.getMemberPriceDiamond()),
                defaultDecimal(product.getMemberPriceBlackDiamond()),
                defaultDecimal(product.getRetailPrice()),
                defaultString(resolveCategoryName(product.getCategoryId())),
                defaultString(product.getSellingPoint()));
    }

    private QuotationItemSnapshot readSnapshot(String snapshotJson) {
        try {
            return objectMapper.readValue(snapshotJson, SNAPSHOT_TYPE);
        } catch (Exception exception) {
            throw new BusinessException("报价单快照解析失败");
        }
    }

    private String writeSnapshot(QuotationItemSnapshot snapshot) {
        try {
            return objectMapper.writeValueAsString(snapshot);
        } catch (Exception exception) {
            throw new BusinessException("报价单快照保存失败");
        }
    }

    private String resolveCategoryName(Long categoryId) {
        if (categoryId == null) {
            return "";
        }
        return operatorCatalogService.getBootstrap().categories().stream()
                .filter(category -> Objects.equals(category.id(), String.valueOf(categoryId)))
                .map(OperatorCatalogService.CategoryRecord::categoryName)
                .findFirst()
                .orElse("");
    }

    private QuotationSheetEntity getRequiredQuotation(Long quotationId) {
        QuotationSheetEntity entity = quotationSheetMapper.selectById(quotationId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("报价单不存在");
        }
        return entity;
    }

    private ProductSpuEntity getRequiredProduct(Long productId) {
        ProductSpuEntity entity = productSpuMapper.selectById(productId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("商品不存在");
        }
        return entity;
    }

    private Map<Long, List<QuotationItemEntity>> listQuotationItemMap() {
        return quotationItemMapper.selectList(new LambdaQueryWrapper<QuotationItemEntity>()
                        .orderByAsc(QuotationItemEntity::getSortOrder))
                .stream()
                .collect(Collectors.groupingBy(
                        QuotationItemEntity::getQuotationId,
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    private List<QuotationItemEntity> listQuotationItems(Long quotationId) {
        return quotationItemMapper.selectList(new LambdaQueryWrapper<QuotationItemEntity>()
                .eq(QuotationItemEntity::getQuotationId, quotationId)
                .orderByAsc(QuotationItemEntity::getSortOrder));
    }

    private Map<Long, String> listOperatorNameMap() {
        return sysUserMapper.selectList(null).stream()
                .collect(Collectors.toMap(SysUserEntity::getId, SysUserEntity::getDisplayName));
    }

    private QuotationRecord toQuotationRecord(
            QuotationSheetEntity entity,
            List<QuotationItemEntity> itemEntities,
            Map<Long, String> operatorNameMap) {
        return new QuotationRecord(
                String.valueOf(entity.getId()),
                entity.getQuotationNo(),
                entity.getQuotationTitle(),
                entity.getCustomerCompany(),
                entity.getCustomerName(),
                entity.getContactName(),
                entity.getContactPhone(),
                entity.getRemark(),
                entity.getTotalProductCount(),
                entity.getTotalQuantity(),
                entity.getCreatedByUserId() == null ? null : String.valueOf(entity.getCreatedByUserId()),
                operatorNameMap.getOrDefault(entity.getCreatedByUserId(), ""),
                entity.getLastExportedAt(),
                itemEntities.stream().map(this::toQuotationItemRecord).toList(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    private QuotationItemRecord toQuotationItemRecord(QuotationItemEntity entity) {
        QuotationItemSnapshot snapshot = readSnapshot(entity.getSnapshotJson());
        return new QuotationItemRecord(
                String.valueOf(entity.getId()),
                String.valueOf(entity.getProductId()),
                snapshot.categoryName(),
                snapshot.originCountry(),
                snapshot.brandName(),
                snapshot.productName(),
                snapshot.productCode(),
                snapshot.barcode(),
                entity.getQuantity(),
                snapshot.stockQuantity() == null ? 0 : snapshot.stockQuantity(),
                snapshot.memberPriceBronze(),
                snapshot.memberPriceSilver(),
                snapshot.memberPriceGold(),
                snapshot.memberPricePlatinum(),
                snapshot.memberPriceDiamond(),
                snapshot.memberPriceBlackDiamond(),
                snapshot.retailPrice(),
                snapshot.mainImage(),
                snapshot.boxImage(),
                snapshot.netContent(),
                snapshot.caseSpec(),
                snapshot.shelfLifeMonths(),
                snapshot.sizeCm(),
                snapshot.grossWeightKg(),
                snapshot.ingredients());
    }

    private String generateQuotationNo() {
        return "QT-" + DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
    }

    private Path resolveTemplatePath() {
        List<Path> candidates = List.of(
                Paths.get("..", "..", "apps", "operation-admin", "public", "小程序参数参考.xlsx").normalize(),
                Paths.get("apps", "operation-admin", "public", "小程序参数参考.xlsx").normalize(),
                Paths.get("operation-admin", "public", "小程序参数参考.xlsx").normalize());
        return candidates.stream()
                .map(Path::toAbsolutePath)
                .filter(Files::exists)
                .findFirst()
                .orElseThrow(() -> new BusinessException("报价单模板不存在"));
    }

    private void cloneRowStyle(Row templateRow, Row targetRow) {
        if (templateRow == null) {
            return;
        }
        targetRow.setHeight(templateRow.getHeight());
        for (int cellIndex = 0; cellIndex < templateRow.getLastCellNum(); cellIndex++) {
            if (templateRow.getCell(cellIndex) == null) {
                continue;
            }
            targetRow.createCell(cellIndex).setCellStyle(templateRow.getCell(cellIndex).getCellStyle());
        }
    }

    private void fillSnapshotRow(Workbook workbook, Sheet sheet, Row row, QuotationItemSnapshot snapshot) {
        row.createCell(0).setCellValue(snapshot.categoryName());
        row.createCell(1).setCellValue(snapshot.originCountry());
        row.createCell(2).setCellValue(snapshot.brandName());
        row.createCell(5).setCellValue(snapshot.barcode());
        row.createCell(6).setCellValue(snapshot.productName());
        row.createCell(7).setCellValue(snapshot.netContent());
        row.createCell(8).setCellValue(snapshot.caseSpec());
        row.createCell(9).setCellValue(numberValue(snapshot.palletsPerContainer()));
        row.createCell(10).setCellValue(numberValue(snapshot.casesPerPallet()));
        row.createCell(11).setCellValue(numberValue(snapshot.casesPerContainer()));
        row.createCell(12).setCellValue(numberValue(snapshot.shelfLifeMonths()));
        row.createCell(13).setCellValue(snapshot.sizeCm());
        row.createCell(14).setCellValue(snapshot.grossWeightKg());
        row.createCell(15).setCellValue(snapshot.ingredients());
        row.createCell(16).setCellValue(numberValue(snapshot.stockQuantity()));
        row.createCell(17).setCellValue(snapshot.memberPriceBronze().doubleValue());
        row.createCell(18).setCellValue(snapshot.memberPriceSilver().doubleValue());
        row.createCell(19).setCellValue(snapshot.memberPriceGold().doubleValue());
        row.createCell(20).setCellValue(snapshot.memberPricePlatinum().doubleValue());
        row.createCell(21).setCellValue(snapshot.memberPriceDiamond().doubleValue());
        row.createCell(22).setCellValue(snapshot.memberPriceBlackDiamond().doubleValue());
        row.createCell(23).setCellValue(snapshot.retailPrice().doubleValue());
        insertImage(workbook, sheet, row.getRowNum(), 3, snapshot.mainImage());
        insertImage(workbook, sheet, row.getRowNum(), 4, snapshot.boxImage());
    }

    private double numberValue(Integer value) {
        return value == null ? 0D : value.doubleValue();
    }

    private void insertImage(Workbook workbook, Sheet sheet, int rowIndex, int columnIndex, String value) {
        if (value == null || value.isBlank()) {
            sheet.getRow(rowIndex).createCell(columnIndex).setCellValue("");
            return;
        }
        if (!value.startsWith("data:image")) {
            sheet.getRow(rowIndex).createCell(columnIndex).setCellValue(value);
            return;
        }
        try {
            int commaIndex = value.indexOf(',');
            String metadata = value.substring(0, commaIndex);
            byte[] imageBytes = Base64.getDecoder().decode(value.substring(commaIndex + 1));
            int pictureType = metadata.contains("png") ? Workbook.PICTURE_TYPE_PNG : Workbook.PICTURE_TYPE_JPEG;
            int pictureIndex = workbook.addPicture(imageBytes, pictureType);
            CreationHelper helper = workbook.getCreationHelper();
            Drawing<?> drawing = sheet.createDrawingPatriarch();
            ClientAnchor anchor = helper.createClientAnchor();
            anchor.setCol1(columnIndex);
            anchor.setRow1(rowIndex);
            anchor.setCol2(columnIndex + 1);
            anchor.setRow2(rowIndex + 1);
            drawing.createPicture(anchor, pictureIndex);
            sheet.getRow(rowIndex).setHeightInPoints(64);
        } catch (Exception exception) {
            sheet.getRow(rowIndex).createCell(columnIndex).setCellValue("图片加载失败");
        }
    }

    private BigDecimal defaultDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }

    public record QuotationBootstrapPayload(
            List<QuotationRecord> quotations,
            List<OperatorCatalogService.ProductRecord> products) {
    }

    public record QuotationRecord(
            String id,
            String quotationNo,
            String quotationTitle,
            String customerCompany,
            String customerName,
            String contactName,
            String contactPhone,
            String remark,
            int totalProductCount,
            int totalQuantity,
            String createdByUserId,
            String createdByUserName,
            LocalDateTime lastExportedAt,
            List<QuotationItemRecord> items,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record QuotationItemRecord(
            String id,
            String productId,
            String categoryName,
            String originCountry,
            String brandName,
            String productName,
            String productCode,
            String barcode,
            int quantity,
            int stockQuantity,
            BigDecimal memberPriceBronze,
            BigDecimal memberPriceSilver,
            BigDecimal memberPriceGold,
            BigDecimal memberPricePlatinum,
            BigDecimal memberPriceDiamond,
            BigDecimal memberPriceBlackDiamond,
            BigDecimal retailPrice,
            String mainImage,
            String boxImage,
            String netContent,
            String caseSpec,
            Integer shelfLifeMonths,
            String sizeCm,
            String grossWeightKg,
            String ingredients) {
    }

    public record QuotationUpsertRequest(
            @NotBlank(message = "报价单标题不能为空") String quotationTitle,
            @NotBlank(message = "客户公司不能为空") String customerCompany,
            @NotBlank(message = "客户名称不能为空") String customerName,
            @NotBlank(message = "联系人不能为空") String contactName,
            @NotBlank(message = "联系电话不能为空") String contactPhone,
            String remark,
            @Valid @NotEmpty(message = "请至少添加一个商品") List<QuotationItemUpsertRequest> items) {
    }

    public record QuotationItemUpsertRequest(
            @NotBlank(message = "商品不能为空") String productId,
            @NotNull(message = "数量不能为空") Integer quantity) {
        public Long parseProductId() {
            return Long.parseLong(productId);
        }
    }

    public record QuotationItemSnapshot(
            String productName,
            String productCode,
            String brandName,
            String originCountry,
            String mainImage,
            String boxImage,
            String barcode,
            String netContent,
            String caseSpec,
            Integer palletsPerContainer,
            Integer casesPerPallet,
            Integer casesPerContainer,
            Integer shelfLifeMonths,
            String sizeCm,
            String grossWeightKg,
            String ingredients,
            Integer stockQuantity,
            BigDecimal memberPriceBronze,
            BigDecimal memberPriceSilver,
            BigDecimal memberPriceGold,
            BigDecimal memberPricePlatinum,
            BigDecimal memberPriceDiamond,
            BigDecimal memberPriceBlackDiamond,
            BigDecimal retailPrice,
            String categoryName,
            String sellingPoint) {
    }

    public record ExportFile(String fileName, byte[] content) {
    }
}
