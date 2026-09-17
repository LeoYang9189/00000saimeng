# 赛盟微商城数据库初稿

## 1. 数据库选型

- 数据库：MySQL 8
- 字符集：`utf8mb4`
- 排序规则：`utf8mb4_unicode_ci`

## 2. 核心表分域

## 2.1 系统与权限

- `sys_user`
- `sys_role`
- `sys_menu`
- `sys_user_role`
- `sys_role_menu`
- `sys_operation_log`

说明：

- `sys_user` 是统一账号表。
- 用户通过 `sys_user_role` 同时拥有客户角色、分销角色或运营角色。

## 2.2 会员中心

- `member_user`
- `member_real_name_auth`
- `member_address`
- `member_tag`
- `member_tag_relation`

## 2.3 分销商中心

- `merchant_info`
- `merchant_settlement_account`
- `merchant_qualification`
- `merchant_audit_record`
- `merchant_staff`

说明：

- 分销商申请主体绑定 `sys_user`。
- 账号必须先完成实名认证，才允许提交分销商入驻。

## 2.4 商品中心

- `product_category`
- `product_brand`
- `product_spu`
- `product_sku`
- `product_media`
- `product_audit_record`
- `product_public_pool`
- `merchant_product_relation`
- `merchant_distribution_link`

说明：

- `product_spu` / `product_sku` 保存商品主数据。
- `product_spu` 需要包含来源类型、来源主体、审核状态字段。
- `product_public_pool` 表示商品是否进入公海库以及进入时间。
- `merchant_product_relation` 表示分销商从公海库选中的商品或其自有商品的分销关系。
- `merchant_distribution_link` 保存分销商维度的分销链接。

## 2.5 订单中心

- `cart_item`
- `trade_order`
- `trade_order_item`
- `trade_order_delivery`
- `trade_after_sale`

## 2.6 营销中心

- `marketing_activity`
- `marketing_activity_product`
- `quotation_sheet`
- `quotation_sheet_item`

## 2.7 AI 中心

- `ai_task`
- `ai_prompt_template`
- `ai_generated_content`
- `ai_knowledge_document`

## 3. 统一字段规范

所有主业务表建议包含：

- `id`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `deleted`

关键字段建议：

- `product_spu.source_type`：平台上传 / 分销商上传
- `product_spu.source_merchant_id`：来源分销商，平台上传时为空
- `product_spu.audit_status`：待审 / 通过 / 驳回
- `merchant_product_relation.select_source`：公海选品 / 自主提报
- `member_real_name_auth.auth_status`：待审 / 通过 / 驳回

## 4. 首批优先落表顺序

1. `sys_user` / `sys_role` / `sys_menu`
2. `member_user` / `member_real_name_auth` / `member_address`
3. `merchant_info` / `merchant_qualification` / `merchant_audit_record`
4. `product_category` / `product_brand` / `product_spu` / `product_sku` / `product_audit_record` / `product_public_pool`
5. `trade_order` / `trade_order_item`
6. `merchant_product_relation` / `merchant_distribution_link`
7. `ai_task` / `ai_generated_content`
