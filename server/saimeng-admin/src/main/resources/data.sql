MERGE INTO sys_user (id, phone, password, display_name, enterprise_id, enabled, deleted, created_at, updated_at)
KEY(id) VALUES
(1, 'admin', 'admin123', '赛盟运营管理员', NULL, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(101, '13820000001', 'member123', '赛盟用户晓岚', NULL, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(102, '13820000002', 'member123', '赛盟用户子航', 8201, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(103, '13820000003', 'member123', '赛盟用户念安', NULL, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(104, '13820000004', 'member123', '赛盟用户嘉禾', 8202, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(105, '13820000005', 'member123', '赛盟用户予安', NULL, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(106, '13820000006', 'member123', '赛盟用户承礼', 8203, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(107, '13820000007', 'member123', '子航采购助理', 8201, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(108, '13820000008', 'member123', '嘉禾门店运营', 8202, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(109, '13820000009', 'member123', '承礼渠道专员', 8203, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(110, '13820000010', 'member123', '赛盟用户砚秋', NULL, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO sys_user_role (id, user_id, role_code, created_at)
KEY(id) VALUES
(1, 1, 'OPERATOR_ADMIN', CURRENT_TIMESTAMP),
(2, 102, 'DISTRIBUTOR', CURRENT_TIMESTAMP),
(3, 104, 'DISTRIBUTOR', CURRENT_TIMESTAMP),
(4, 106, 'DISTRIBUTOR', CURRENT_TIMESTAMP),
(5, 107, 'DISTRIBUTOR', CURRENT_TIMESTAMP),
(6, 108, 'DISTRIBUTOR', CURRENT_TIMESTAMP),
(7, 109, 'DISTRIBUTOR', CURRENT_TIMESTAMP);

MERGE INTO member_real_name_auth (id, user_id, real_name, id_card_no, status, review_remark, submitted_at, reviewed_at)
KEY(id) VALUES
(8001, 101, '陈晓岚', '330102199201010011', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8002, 102, '沈子航', '330102199302020022', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8003, 103, '许念安', '330102199403030033', 'PENDING', NULL, CURRENT_TIMESTAMP, NULL),
(8004, 104, '周嘉禾', '330102199504040044', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8005, 105, '顾予安', '330102199605050055', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8006, 106, '宋承礼', '330102199706060066', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8007, 107, '陈昱辰', '330102199807070077', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8008, 108, '叶知夏', '330102199908080088', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8009, 109, '梁书礼', '330102200001010099', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8010, 110, '林砚秋', '330102200101010110', 'APPROVED', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO member_feedback (
    id, user_id, feedback_type, related_order_no, content, contact, attachment_names_json,
    status, source_channel, created_at, updated_at
)
KEY(id) VALUES
(8801, 102, 'SUGGESTION', 'SM202608250001', '建议在商品详情页增加到港批次与发货时效说明，方便经销商快速判断是否适合当前客户。', '13820000002', '["feedback-example-01.png"]',
 'SUBMITTED', 'WEB_STORE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO merchant_application (
    id, user_id, store_name, company_name, contact_name, contact_phone, business_scope, status, review_remark, extra_payload_json, submitted_at, reviewed_at
)
KEY(id) VALUES
(8101, 101, '晓岚选品馆', '杭州晓岚贸易有限公司', '陈晓岚', '13820000001', '主营进口酒水与节庆礼盒分销。', 'PENDING', NULL,
 '{"basicInfo":{"companyAddress":"浙江省杭州市滨江区江南大道 88 号","legalRepresentative":"陈晓岚","unifiedSocialCreditCode":"91330100XIAOLAN001"},"financeInfo":{"bankName":"招商银行杭州滨江支行","bankAccountName":"杭州晓岚贸易有限公司","bankAccountNo":"6225888800000001","invoiceTitle":"杭州晓岚贸易有限公司"},"businessInfo":{"preferredCategories":["进口酒水","节庆礼盒"],"expectedMonthlyPurchase":"18","expectedRepaymentDays":"30","recommendedPolicy":"适合节庆礼赠与门店团购场景"}}',
 CURRENT_TIMESTAMP, NULL),
(8102, 102, '子航供应社', '宁波子航供应链有限公司', '沈子航', '13820000002', '主营进口零食、酒饮和伴手礼私域分销。', 'APPROVED', NULL,
 '{"basicInfo":{"companyAddress":"浙江省宁波市鄞州区创新大道 66 号","legalRepresentative":"沈子航","unifiedSocialCreditCode":"91330200ZIHANG002"},"financeInfo":{"bankName":"中国银行宁波分行","bankAccountName":"宁波子航供应链有限公司","bankAccountNo":"6222000200000002","invoiceTitle":"宁波子航供应链有限公司"},"businessInfo":{"preferredCategories":["进口零食","酒饮","伴手礼"],"expectedMonthlyPurchase":"32","expectedRepaymentDays":"25","recommendedPolicy":"适合礼赠分销与私域组合采购"}}',
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8103, 103, '念安海外仓', '上海念安供应链管理有限公司', '许念安', '13820000003', '主营跨境选品与仓配服务。', 'REJECTED', '营业范围描述不完整，请补充主营品类。',
 '{"basicInfo":{"companyAddress":"上海市浦东新区自贸园区 18 号","legalRepresentative":"许念安","unifiedSocialCreditCode":"91310000NIANAN003"},"financeInfo":{"bankName":"交通银行上海自贸区支行","bankAccountName":"上海念安供应链管理有限公司","bankAccountNo":"6222600300000003","invoiceTitle":"上海念安供应链管理有限公司"},"businessInfo":{"preferredCategories":["跨境选品","仓配服务"],"expectedMonthlyPurchase":"12","expectedRepaymentDays":"35","recommendedPolicy":"先补齐主营类目后再进入人工复核"}}',
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8104, 105, '予安进口优选', '广州予安国际贸易有限公司', '顾予安', '13820000005', '主营进口母婴与营养保健渠道分销。', 'PENDING', NULL,
 '{"basicInfo":{"companyAddress":"广东省广州市天河区花城大道 168 号","legalRepresentative":"顾予安","unifiedSocialCreditCode":"91440100YUAN004"},"financeInfo":{"bankName":"工商银行广州珠江新城支行","bankAccountName":"广州予安国际贸易有限公司","bankAccountNo":"6222020400000004","invoiceTitle":"广州予安国际贸易有限公司"},"businessInfo":{"preferredCategories":["进口母婴","营养保健"],"expectedMonthlyPurchase":"24","expectedRepaymentDays":"30","recommendedPolicy":"适合母婴连锁与团购渠道补货"}}',
 CURRENT_TIMESTAMP, NULL),
(8105, 106, '承礼精选店', '深圳承礼食品有限公司', '宋承礼', '13820000006', '主营进口零食、饮品与礼赠场景渠道供货。', 'APPROVED', NULL,
 '{"basicInfo":{"companyAddress":"广东省深圳市南山区科技园 9 号","legalRepresentative":"宋承礼","unifiedSocialCreditCode":"91440300CHENGLI005"},"financeInfo":{"bankName":"建设银行深圳南山支行","bankAccountName":"深圳承礼食品有限公司","bankAccountNo":"6227000500000005","invoiceTitle":"深圳承礼食品有限公司"},"businessInfo":{"preferredCategories":["进口零食","饮品","礼赠场景"],"expectedMonthlyPurchase":"40","expectedRepaymentDays":"20","recommendedPolicy":"适合节日礼盒与门店陈列双渠道供货"}}',
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO product_category (
    id, parent_id, category_name, category_code, category_level, sort_order, enabled, deleted, created_at, updated_at
)
KEY(id) VALUES
(9001, NULL, '食品酒饮', 'FOOD', 1, 10, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9002, 9001, '饮品', 'DRINK', 2, 20, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9003, 9002, '矿泉水', 'MINERAL_WATER', 3, 30, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9004, 9001, '酒类', 'WINE', 2, 40, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9005, 9004, '红酒', 'RED_WINE', 3, 50, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9006, 9001, '啤酒', 'BEER', 2, 60, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9007, 9006, '黑啤', 'DARK_BEER', 3, 70, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO product_spu (
    id, product_name, product_code, category_id, brand_name, origin_country, selling_point,
    main_image, thumbnail_image, box_image, gallery_images, barcode, net_content, case_spec,
    pallets_per_container, cases_per_pallet, cases_per_container, shelf_life_months, size_cm,
    gross_weight_kg, ingredients, stock_quantity, member_price_bronze, member_price_silver,
    member_price_gold, member_price_platinum, member_price_diamond, member_price_black_diamond,
    retail_price, detail_html, source_type, source_merchant_user_id,
    audit_status, in_public_pool, enabled, deleted, created_by_user_id, created_at, updated_at, reviewed_by_user_id, reviewed_at
)
KEY(id) VALUES
(4001, '法国原瓶进口红酒', 'P-4001', 9005, '卡思黛乐', '法国', '适合高复购私域分销场景',
 '/home/item/featured-weekly-01.jpg.png', '/home/item/procurement-thumb-wine-01.jpg.png', '/home/item/procurement-main-wine.jpg.png',
 '["/home/item/featured-weekly-01.jpg.png","/home/item/procurement-thumb-wine-01.jpg.png","/home/item/procurement-thumb-wine-02.jpg.png","/home/item/procurement-thumb-wine-03.jpg.png","/home/item/procurement-main-wine.jpg.png"]',
 '3760123456789/瓶 3760123456796/箱', '750ml', '750ml*6',
 18, 60, 1080, 24, '32x24x18', '9.6kg', '葡萄汁、二氧化硫', 860,
 368.00, 356.00, 345.00, 334.00, 322.00, 308.00,
 428.00, '<section><h2>商品亮点</h2><p>法国 AOC 产区原瓶进口，酒体结构平衡，适合节庆礼赠、企业团购与高端商超陈列。</p><p>入口圆润，果香与单宁层次清晰，适合门店做中高客单爆品陈列，也适合渠道做礼盒组合销售。</p><h2>适销场景</h2><ul><li>节庆礼赠与团购渠道</li><li>精品超市与酒饮专柜陈列</li><li>企业客户接待与伴手礼组合</li></ul><h2>包装与履约</h2><p>标准箱规 750ml*6，适合仓配统一发货，后台可直接用于报价与分销场景。</p></section>', 'PLATFORM', NULL,
 'APPROVED', TRUE, TRUE, FALSE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP),
(4002, '德国黑啤礼盒', 'P-4002', 9007, '皇家黑麦', '德国', '节庆礼赠与小店团购转化更强',
 '/home/item/featured-weekly-02.jpg.png', '/home/item/procurement-thumb-snack-01.jpg.png', '/home/item/featured-weekly-03.jpg.png',
 '["/home/item/featured-weekly-02.jpg.png","/home/item/featured-weekly-03.jpg.png","/home/item/featured-weekly-04.jpg.png","/home/item/procurement-thumb-snack-01.jpg.png","/home/item/procurement-thumb-snack-02.jpg.png"]',
 '4012345678901/瓶 4012345678918/箱', '500ml', '500ml*12',
 22, 72, 1584, 18, '41x28x27', '11.4kg', '水、大麦芽、啤酒花、酵母', 1280,
 118.00, 112.00, 108.00, 103.00, 99.00, 95.00,
 138.00, '<section><h2>商品亮点</h2><p>德国风味黑啤礼盒，麦芽香气浓郁，泡沫细腻，适合礼品渠道、小店组合销售与节庆活动搭配。</p><p>礼盒陈列感强，适合门店前排展示和活动搭赠，兼顾自饮与送礼场景。</p><h2>适销场景</h2><ul><li>门店节庆礼盒专区</li><li>社区团购与企业福利</li><li>夜场餐饮与聚会场景</li></ul><h2>包装与履约</h2><p>500ml*12 礼盒装，适合整箱销售与批量调拨，仓配操作简洁。</p></section>', 'PLATFORM', NULL,
 'APPROVED', TRUE, TRUE, FALSE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP),
(4003, '圣碧涛充气天然矿泉水', 'P-4003', 9003, '圣碧涛 SAN BENEDETTO', '意大利', '天然矿泉水与餐饮渠道适配度高',
 '/home/item/featured-weekly-05.jpg.png', '/home/item/procurement-thumb-supplements-01.jpg.png', '/home/item/procurement-main-supplements.jpg.png',
 '["/home/item/featured-weekly-05.jpg.png","/home/item/featured-weekly-06.jpg.webp","/home/item/procurement-thumb-supplements-01.jpg.png","/home/item/procurement-thumb-supplements-02.jpg.webp","/home/item/procurement-main-supplements.jpg.png"]',
 '8056600020735/瓶 8056600020445/箱', '1.5L', '1.5L*6',
 24, 105, 2520, 15, '27x17x34.5', '10kg', '天然矿泉水、二氧化碳', 9999,
 59.00, 59.00, 59.00, 59.00, 59.00, 59.00,
 59.00, '<section><h2>商品亮点</h2><p>意大利原装进口充气天然矿泉水，气泡细密清爽，适合餐饮、零售与会务场景。</p><p>品牌识别度高，适合做门店冷柜陈列和商务接待用水，也适合组合搭售。</p><h2>适销场景</h2><ul><li>餐饮渠道与咖啡烘焙门店</li><li>会务用水与企业接待</li><li>高频复购的便利零售场景</li></ul><h2>包装与履约</h2><p>1.5L*6 标准箱规，便于整箱配送与报价单维护。</p></section>', 'PLATFORM', NULL,
 'APPROVED', TRUE, TRUE, FALSE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP);

MERGE INTO quotation_sheet (
    id, quotation_no, quotation_title, customer_company, customer_name, contact_name, contact_phone, remark,
    total_product_count, total_quantity, created_by_user_id, last_exported_at, deleted, created_at, updated_at
)
KEY(id) VALUES
(9101, 'QT-202608250001', '8 月进口酒饮渠道报价', '宁波子航供应链有限公司', '沈子航', '沈子航', '13820000002', '用于私域与团购客户选品沟通。', 2, 30, 1, NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO quotation_item (
    id, quotation_id, product_id, product_name_snapshot, quantity, sort_order, snapshot_json, created_at, updated_at
)
KEY(id) VALUES
(9201, 9101, 4001, '法国原瓶进口红酒', 12, 1, '{"productName":"法国原瓶进口红酒","productCode":"P-4001","brandName":"卡思黛乐","originCountry":"法国","mainImage":"","boxImage":"","barcode":"3760123456789/瓶 3760123456796/箱","netContent":"750ml","caseSpec":"750ml*6","palletsPerContainer":18,"casesPerPallet":60,"casesPerContainer":1080,"shelfLifeMonths":24,"sizeCm":"32x24x18","grossWeightKg":"9.6kg","ingredients":"葡萄汁、二氧化硫","stockQuantity":860,"memberPriceBronze":368.00,"memberPriceSilver":356.00,"memberPriceGold":345.00,"memberPricePlatinum":334.00,"memberPriceDiamond":322.00,"memberPriceBlackDiamond":308.00,"retailPrice":428.00,"categoryName":"红酒","sellingPoint":"适合高复购私域分销场景"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9202, 9101, 4002, '德国黑啤礼盒', 18, 2, '{"productName":"德国黑啤礼盒","productCode":"P-4002","brandName":"皇家黑麦","originCountry":"德国","mainImage":"","boxImage":"","barcode":"4012345678901/瓶 4012345678918/箱","netContent":"500ml","caseSpec":"500ml*12","palletsPerContainer":22,"casesPerPallet":72,"casesPerContainer":1584,"shelfLifeMonths":18,"sizeCm":"41x28x27","grossWeightKg":"11.4kg","ingredients":"水、大麦芽、啤酒花、酵母","stockQuantity":1280,"memberPriceBronze":118.00,"memberPriceSilver":112.00,"memberPriceGold":108.00,"memberPricePlatinum":103.00,"memberPriceDiamond":99.00,"memberPriceBlackDiamond":95.00,"retailPrice":138.00,"categoryName":"黑啤","sellingPoint":"节庆礼赠与小店团购转化更强"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO operator_department (
    id, parent_id, name, code, manager_employee_id, description, sort_order, deleted, created_at, updated_at
)
KEY(id) VALUES
(1001, NULL, '赛盟商城', 'SEA-MIND', 2001, '运营后台顶级组织节点。', 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1002, 1001, '运营中心', 'OPS', 2001, '负责平台运营、活动、内容与增长。', 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1003, 1002, '品牌运营部', 'BRAND', 2002, '负责品牌内容、Banner、素材与营销活动。', 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1004, 1001, '人力行政部', 'HR', 2004, '负责人事、组织、角色与员工档案维护。', 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO operator_employee (
    id, name, employee_no, phone, email, department_id, position, status, join_date,
    address, bio, emergency_contact, emergency_phone, deleted, created_at, updated_at
)
KEY(id) VALUES
(2001, '林清禾', 'SM1001', '13800000001', 'admin@bingyuscm.com', 1002, '运营总监', 'ACTIVE', DATE '2025-03-01',
 '杭州市余杭区仓前街道赛盟运营中心', '负责运营后台治理、组织协同与关键流程推进。', '林先生', '13800000009', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2002, '周以宁', 'SM1002', '13800000002', 'brand@seamind.com', 1003, '品牌运营经理', 'ACTIVE', DATE '2025-06-12',
 '杭州市余杭区品牌运营办公室', '负责品牌活动、Banner 素材与官网内容统筹。', '周女士', '13800000012', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2003, '谢从礼', 'SM1003', '13800000003', 'sales@seamind.com', 1002, '渠道拓展专员', 'INVITED', DATE '2026-08-01',
 '杭州市余杭区运营中心 3F', '负责渠道资料维护、报价支持与客户触达。', '谢女士', '13800000013', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2004, '许知夏', 'SM1004', '13800000004', 'hr@seamind.com', 1004, '组织发展经理', 'ACTIVE', DATE '2025-09-20',
 '杭州市余杭区人力行政部', '负责组织架构、角色权限与员工档案管理。', '许先生', '13800000014', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO operator_account (
    id, employee_id, account, password, enabled, deleted, created_at, updated_at, last_login_at
)
KEY(id) VALUES
(3001, 2001, 'admin', 'admin123', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(3002, 2002, 'brand.manager', 'brand123', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(3003, 2003, 'sales.agent', 'sales123', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(3004, 2004, 'hr.admin', 'hr123', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);

MERGE INTO operator_role (
    id, name, code, description, is_built_in, deleted, created_at, updated_at
)
KEY(id) VALUES
(4001, '超级管理员', 'OPERATOR_ADMIN', '拥有运营后台全部菜单与功能权限。', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4002, '运营主管', 'OPS_MANAGER', '负责营销投放、Banner、素材与订单跟进。', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4003, '内容运营', 'CONTENT_EDITOR', '负责营销中心内容与网站内容配置。', FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4004, '组织管理员', 'HR_ADMIN', '负责人事组织、角色权限与员工档案维护。', FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO operator_permission (
    id, parent_id, title, permission_key, permission_type, route_path, sort_order, deleted, created_at, updated_at
)
KEY(id) VALUES
(5001, NULL, '工作台', 'dashboard', 'MENU', '/admin/dashboard', 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5002, 5001, '查看工作台', 'dashboard.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5050, NULL, '用户中心', 'user-center', 'MENU', NULL, 15, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5051, 5050, '用户管理', 'user-center.users', 'MENU', '/admin/user-center/users', 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5052, 5051, '查看用户', 'user-center.users.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5053, 5051, '新增用户', 'user-center.users.create', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5054, 5051, '编辑用户', 'user-center.users.edit', 'ACTION', NULL, 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5055, 5051, '删除用户', 'user-center.users.delete', 'ACTION', NULL, 40, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5056, 5050, '审核管理', 'user-center.reviews', 'MENU', '/admin/user-center/reviews', 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5057, 5056, '查看审核单', 'user-center.reviews.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5058, 5056, '通过审核', 'user-center.reviews.approve', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5059, 5056, '驳回审核', 'user-center.reviews.reject', 'ACTION', NULL, 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5060, 5050, '企业管理', 'user-center.companies', 'MENU', '/admin/user-center/companies', 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5061, 5060, '查看企业', 'user-center.companies.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5062, 5060, '新增企业', 'user-center.companies.create', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5063, 5060, '编辑企业', 'user-center.companies.edit', 'ACTION', NULL, 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5064, 5060, '禁用企业', 'user-center.companies.disable', 'ACTION', NULL, 40, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5065, 5050, '会员管理', 'user-center.members', 'MENU', '/admin/user-center/members', 40, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5066, 5065, '查看等级', 'user-center.members.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5067, 5065, '新增等级', 'user-center.members.create', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5068, 5065, '编辑等级', 'user-center.members.edit', 'ACTION', NULL, 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5069, 5065, '删除等级', 'user-center.members.delete', 'ACTION', NULL, 40, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5100, NULL, '企业中心', 'enterprise', 'MENU', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5101, 5100, '员工管理', 'enterprise.employees', 'MENU', '/admin/enterprise/employees', 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5102, 5101, '查看员工', 'enterprise.employees.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5103, 5101, '新增员工', 'enterprise.employees.create', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5104, 5101, '编辑员工', 'enterprise.employees.edit', 'ACTION', NULL, 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5105, 5101, '删除员工', 'enterprise.employees.delete', 'ACTION', NULL, 40, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5106, 5100, '角色管理', 'enterprise.roles', 'MENU', '/admin/enterprise/roles', 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5107, 5106, '查看角色', 'enterprise.roles.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5108, 5106, '新增角色', 'enterprise.roles.create', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5109, 5106, '编辑角色', 'enterprise.roles.edit', 'ACTION', NULL, 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5110, 5106, '删除角色', 'enterprise.roles.delete', 'ACTION', NULL, 40, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5111, 5100, '权限管理', 'enterprise.permissions', 'MENU', '/admin/enterprise/permissions', 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5112, 5111, '查看权限', 'enterprise.permissions.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5113, 5111, '配置权限', 'enterprise.permissions.edit', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5114, 5100, '组织架构', 'enterprise.organization', 'MENU', '/admin/enterprise/organization', 40, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5115, 5114, '查看组织架构', 'enterprise.organization.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5116, 5114, '新增部门', 'enterprise.organization.create', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5117, 5114, '编辑部门', 'enterprise.organization.edit', 'ACTION', NULL, 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5118, 5114, '删除部门', 'enterprise.organization.delete', 'ACTION', NULL, 40, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5200, NULL, '系统设置', 'settings', 'MENU', NULL, 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5201, 5200, '个人中心', 'settings.profile', 'MENU', '/admin/settings/profile', 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5202, 5201, '查看个人信息', 'settings.profile.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5203, 5201, '修改个人信息', 'settings.profile.edit', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5204, 5200, 'AI设置', 'settings.ai', 'MENU', '/admin/settings/ai', 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5205, 5204, '查看 AI 网关配置', 'settings.ai.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5206, 5204, '编辑 AI 网关配置', 'settings.ai.edit', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5207, 5200, '网站管理', 'settings.site', 'MENU', '/admin/settings/site', 30, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5208, 5207, '查看网站配置', 'settings.site.view', 'ACTION', NULL, 10, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5209, 5207, '编辑网站配置', 'settings.site.edit', 'ACTION', NULL, 20, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO operator_role_permission (id, role_id, permission_id, created_at)
KEY(id) VALUES
(6001, 4001, 5001, CURRENT_TIMESTAMP),
(6002, 4001, 5002, CURRENT_TIMESTAMP),
(6003, 4001, 5050, CURRENT_TIMESTAMP),
(6004, 4001, 5051, CURRENT_TIMESTAMP),
(6005, 4001, 5052, CURRENT_TIMESTAMP),
(6006, 4001, 5053, CURRENT_TIMESTAMP),
(6007, 4001, 5054, CURRENT_TIMESTAMP),
(6008, 4001, 5055, CURRENT_TIMESTAMP),
(6009, 4001, 5056, CURRENT_TIMESTAMP),
(6010, 4001, 5057, CURRENT_TIMESTAMP),
(6011, 4001, 5058, CURRENT_TIMESTAMP),
(6012, 4001, 5059, CURRENT_TIMESTAMP),
(6013, 4001, 5060, CURRENT_TIMESTAMP),
(6014, 4001, 5061, CURRENT_TIMESTAMP),
(6015, 4001, 5062, CURRENT_TIMESTAMP),
(6016, 4001, 5063, CURRENT_TIMESTAMP),
(6017, 4001, 5064, CURRENT_TIMESTAMP),
(6018, 4001, 5065, CURRENT_TIMESTAMP),
(6019, 4001, 5066, CURRENT_TIMESTAMP),
(6020, 4001, 5067, CURRENT_TIMESTAMP),
(6021, 4001, 5068, CURRENT_TIMESTAMP),
(6022, 4001, 5069, CURRENT_TIMESTAMP),
(6023, 4001, 5100, CURRENT_TIMESTAMP),
(6024, 4001, 5101, CURRENT_TIMESTAMP),
(6025, 4001, 5102, CURRENT_TIMESTAMP),
(6026, 4001, 5103, CURRENT_TIMESTAMP),
(6027, 4001, 5104, CURRENT_TIMESTAMP),
(6028, 4001, 5105, CURRENT_TIMESTAMP),
(6029, 4001, 5106, CURRENT_TIMESTAMP),
(6030, 4001, 5107, CURRENT_TIMESTAMP),
(6031, 4001, 5108, CURRENT_TIMESTAMP),
(6032, 4001, 5109, CURRENT_TIMESTAMP),
(6033, 4001, 5110, CURRENT_TIMESTAMP),
(6034, 4001, 5111, CURRENT_TIMESTAMP),
(6035, 4001, 5112, CURRENT_TIMESTAMP),
(6036, 4001, 5113, CURRENT_TIMESTAMP),
(6037, 4001, 5114, CURRENT_TIMESTAMP),
(6038, 4001, 5115, CURRENT_TIMESTAMP),
(6039, 4001, 5116, CURRENT_TIMESTAMP),
(6040, 4001, 5117, CURRENT_TIMESTAMP),
(6041, 4001, 5118, CURRENT_TIMESTAMP),
(6042, 4001, 5200, CURRENT_TIMESTAMP),
(6043, 4001, 5201, CURRENT_TIMESTAMP),
(6044, 4001, 5202, CURRENT_TIMESTAMP),
(6045, 4001, 5203, CURRENT_TIMESTAMP),
(6046, 4001, 5204, CURRENT_TIMESTAMP),
(6047, 4001, 5205, CURRENT_TIMESTAMP),
(6048, 4001, 5206, CURRENT_TIMESTAMP),
(6049, 4001, 5207, CURRENT_TIMESTAMP),
(6050, 4001, 5208, CURRENT_TIMESTAMP),
(6051, 4001, 5209, CURRENT_TIMESTAMP),
(6052, 4002, 5001, CURRENT_TIMESTAMP),
(6053, 4002, 5002, CURRENT_TIMESTAMP),
(6054, 4002, 5050, CURRENT_TIMESTAMP),
(6055, 4002, 5051, CURRENT_TIMESTAMP),
(6056, 4002, 5052, CURRENT_TIMESTAMP),
(6057, 4002, 5054, CURRENT_TIMESTAMP),
(6058, 4002, 5056, CURRENT_TIMESTAMP),
(6059, 4002, 5057, CURRENT_TIMESTAMP),
(6060, 4002, 5058, CURRENT_TIMESTAMP),
(6061, 4002, 5059, CURRENT_TIMESTAMP),
(6062, 4002, 5060, CURRENT_TIMESTAMP),
(6063, 4002, 5061, CURRENT_TIMESTAMP),
(6064, 4002, 5063, CURRENT_TIMESTAMP),
(6065, 4002, 5064, CURRENT_TIMESTAMP),
(6066, 4002, 5065, CURRENT_TIMESTAMP),
(6067, 4002, 5066, CURRENT_TIMESTAMP),
(6068, 4002, 5068, CURRENT_TIMESTAMP),
(6069, 4002, 5100, CURRENT_TIMESTAMP),
(6070, 4002, 5101, CURRENT_TIMESTAMP),
(6071, 4002, 5102, CURRENT_TIMESTAMP),
(6072, 4002, 5104, CURRENT_TIMESTAMP),
(6073, 4002, 5111, CURRENT_TIMESTAMP),
(6074, 4002, 5112, CURRENT_TIMESTAMP),
(6075, 4002, 5114, CURRENT_TIMESTAMP),
(6076, 4002, 5115, CURRENT_TIMESTAMP),
(6077, 4002, 5200, CURRENT_TIMESTAMP),
(6078, 4002, 5201, CURRENT_TIMESTAMP),
(6079, 4002, 5202, CURRENT_TIMESTAMP),
(6080, 4002, 5203, CURRENT_TIMESTAMP),
(6081, 4003, 5001, CURRENT_TIMESTAMP),
(6082, 4003, 5002, CURRENT_TIMESTAMP),
(6083, 4003, 5200, CURRENT_TIMESTAMP),
(6084, 4003, 5201, CURRENT_TIMESTAMP),
(6085, 4003, 5202, CURRENT_TIMESTAMP),
(6086, 4003, 5203, CURRENT_TIMESTAMP),
(6087, 4003, 5207, CURRENT_TIMESTAMP),
(6088, 4003, 5208, CURRENT_TIMESTAMP),
(6089, 4004, 5001, CURRENT_TIMESTAMP),
(6090, 4004, 5002, CURRENT_TIMESTAMP),
(6091, 4004, 5050, CURRENT_TIMESTAMP),
(6092, 4004, 5051, CURRENT_TIMESTAMP),
(6093, 4004, 5052, CURRENT_TIMESTAMP),
(6094, 4004, 5054, CURRENT_TIMESTAMP),
(6095, 4004, 5065, CURRENT_TIMESTAMP),
(6096, 4004, 5066, CURRENT_TIMESTAMP),
(6097, 4004, 5068, CURRENT_TIMESTAMP),
(6098, 4004, 5100, CURRENT_TIMESTAMP),
(6099, 4004, 5101, CURRENT_TIMESTAMP),
(6100, 4004, 5102, CURRENT_TIMESTAMP),
(6101, 4004, 5103, CURRENT_TIMESTAMP),
(6102, 4004, 5104, CURRENT_TIMESTAMP),
(6103, 4004, 5106, CURRENT_TIMESTAMP),
(6104, 4004, 5107, CURRENT_TIMESTAMP),
(6105, 4004, 5108, CURRENT_TIMESTAMP),
(6106, 4004, 5109, CURRENT_TIMESTAMP),
(6107, 4004, 5111, CURRENT_TIMESTAMP),
(6108, 4004, 5112, CURRENT_TIMESTAMP),
(6109, 4004, 5113, CURRENT_TIMESTAMP),
(6110, 4004, 5114, CURRENT_TIMESTAMP),
(6111, 4004, 5115, CURRENT_TIMESTAMP),
(6112, 4004, 5116, CURRENT_TIMESTAMP),
(6113, 4004, 5117, CURRENT_TIMESTAMP),
(6114, 4004, 5200, CURRENT_TIMESTAMP),
(6115, 4004, 5201, CURRENT_TIMESTAMP),
(6116, 4004, 5202, CURRENT_TIMESTAMP),
(6117, 4004, 5203, CURRENT_TIMESTAMP);

MERGE INTO operator_employee_role (id, employee_id, role_id, created_at)
KEY(id) VALUES
(7001, 2001, 4001, CURRENT_TIMESTAMP),
(7002, 2002, 4002, CURRENT_TIMESTAMP),
(7003, 2002, 4003, CURRENT_TIMESTAMP),
(7004, 2003, 4003, CURRENT_TIMESTAMP),
(7005, 2004, 4004, CURRENT_TIMESTAMP);

MERGE INTO distributor_enterprise (
    id, user_id, application_id, enterprise_no, source_type, company_name, store_name, contact_name,
    contact_phone, business_scope, enabled, review_remark, member_level_key, profile_snapshot_json, deleted, created_at, updated_at
)
KEY(id) VALUES
(8201, 102, 8102, 'SME20260001', 'APPLICATION', '宁波子航供应链有限公司', '子航供应社', '沈子航', '13820000002',
 '主营进口零食、酒饮和伴手礼私域分销。', TRUE, NULL, 'gold',
 '{"basicInfo":{"companyAddress":"浙江省宁波市鄞州区创新大道 66 号","legalRepresentative":"沈子航","unifiedSocialCreditCode":"91330200ZIHANG002"},"financeInfo":{"bankName":"中国银行宁波分行","bankAccountName":"宁波子航供应链有限公司","bankAccountNo":"6222000200000002","invoiceTitle":"宁波子航供应链有限公司"},"businessInfo":{"preferredCategories":["进口零食","酒饮","伴手礼"],"expectedMonthlyPurchase":"32","expectedRepaymentDays":"25","recommendedPolicy":"适合礼赠分销与私域组合采购"}}',
 FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8202, 104, NULL, 'SME20260002', 'DIRECT', '苏州嘉禾跨境贸易有限公司', '嘉禾全球精选', '周嘉禾', '13820000004',
 '主营跨境母婴与家庭消费品渠道分销。', TRUE, '由运营后台直接新增', 'silver',
 '{"basicInfo":{"companyAddress":"江苏省苏州市工业园区金鸡湖大道 18 号","legalRepresentative":"周嘉禾","unifiedSocialCreditCode":"91320500JIAHE004"},"financeInfo":{"bankName":"农业银行苏州工业园区支行","bankAccountName":"苏州嘉禾跨境贸易有限公司","bankAccountNo":"6228480400000004","invoiceTitle":"苏州嘉禾跨境贸易有限公司"},"businessInfo":{"preferredCategories":["跨境母婴","家庭消费品"],"expectedMonthlyPurchase":"22","expectedRepaymentDays":"28","recommendedPolicy":"适合门店母婴区与家庭囤货场景"}}',
 FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8203, 106, 8105, 'SME20260003', 'APPLICATION', '深圳承礼食品有限公司', '承礼精选店', '宋承礼', '13820000006',
 '主营进口零食、饮品与礼赠场景渠道供货。', TRUE, NULL, 'diamond',
 '{"basicInfo":{"companyAddress":"广东省深圳市南山区科技园 9 号","legalRepresentative":"宋承礼","unifiedSocialCreditCode":"91440300CHENGLI005"},"financeInfo":{"bankName":"建设银行深圳南山支行","bankAccountName":"深圳承礼食品有限公司","bankAccountNo":"6227000500000005","invoiceTitle":"深圳承礼食品有限公司"},"businessInfo":{"preferredCategories":["进口零食","饮品","礼赠场景"],"expectedMonthlyPurchase":"40","expectedRepaymentDays":"20","recommendedPolicy":"适合节日礼盒与门店陈列双渠道供货"}}',
 FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO enterprise_join_request (
    id, enterprise_id, user_id, applicant_name, applicant_phone, position, apply_remark, status, review_remark, created_at, reviewed_at
)
KEY(id) VALUES
(8601, 8201, 110, '林砚秋', '13820000010', '采购主管', '负责门店进口零食与酒饮补货，希望加入子航供应社统一采购体系。', 'PENDING', NULL, CURRENT_TIMESTAMP, NULL);

MERGE INTO member_level_config (
    id, level_key, level_name, level_rank, level_title, level_description, summary_text, progress_text,
    mission_text, mission_action, highlight_title, visual_src, hero_start, hero_mid, hero_end, accent,
    soft_accent, card_surface, placeholder_tone, glow_color, spark_color, progress_percent, highlight_keys,
    benefit_keys, enabled, deleted, created_at, updated_at
)
KEY(id) VALUES
(8301, 'bronze', '青铜会员', 0, '青铜会员', '适合刚开始在赛盟商城建立选品节奏与分销触达的新客。', '开放基础购物权益与精选新人礼遇。', '距升级白银还需完成 3 次下单与 1 次选品收藏。', '完成新手任务可解锁首批采样与运费补贴。', '查看成长任务', '青铜会员精选权益', '/home/member/图片 4.png', '#7d6658', '#ad8b74', '#ede3da', '#8e6547', 'rgba(142, 101, 71, 0.16)', 'rgba(255, 247, 240, 0.74)', 'rgba(142, 101, 71, 0.18)', 'rgba(233, 190, 149, 0.42)', 'rgba(255, 248, 232, 0.96)', 22, 'credit,sample,strategy', 'credit,flash', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8302, 'silver', '白银会员', 1, '白银会员', '适合已开始稳定下单的客户，强调效率与基础经营支持。', '新增样品申请、专属运费支持与白银权益包。', '距升级黄金还需累计成交额与分销申请资料完善。', '完成店铺资料补充可解锁黄金等级冲刺任务。', '继续冲刺升级', '白银会员经营亮点', '/home/member/图片 5.png', '#7e8b99', '#aab7c7', '#edf2f7', '#6f8095', 'rgba(111, 128, 149, 0.16)', 'rgba(250, 252, 255, 0.78)', 'rgba(111, 128, 149, 0.18)', 'rgba(226, 237, 246, 0.42)', 'rgba(255, 255, 255, 0.96)', 38, 'sample,credit,strategy', 'credit,sample,flash,travel', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8303, 'gold', '黄金会员', 2, '黄金会员', '适合进入稳定复购阶段的客户，可获得更高频的活动参与和选品支持。', '开放试用权益、精选活动资格与更高等级流量扶持。', '距升级铂金还需完成重点活动报名与复购目标。', '完成活动任务可获得更高阶经营支持。', '前往完成任务', '黄金会员增长权益', '/home/member/图片 6.png', '#886222', '#c89a42', '#f2e2bf', '#a8771f', 'rgba(168, 119, 31, 0.14)', 'rgba(255, 249, 235, 0.8)', 'rgba(168, 119, 31, 0.18)', 'rgba(255, 218, 128, 0.46)', 'rgba(255, 250, 225, 0.98)', 56, 'trial,sample,strategy', 'credit,sample,trial,flash,selection,travel', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8304, 'platinum', '铂金会员', 3, '铂金会员', '适合有持续成交能力的成熟客户，获得更深的经营陪跑和商务礼遇。', '开放沙龙活动、营销支持与仓配协同资源。', '距升级钻石还需完成季度成交与重点合作任务。', '参与平台经营计划可解锁钻石资格评估。', '查看晋级计划', '铂金会员尊享资源', '/home/member/图片 7.png', '#4f545f', '#9098a4', '#ebedf2', '#686f7a', 'rgba(104, 111, 122, 0.14)', 'rgba(252, 253, 255, 0.76)', 'rgba(104, 111, 122, 0.18)', 'rgba(223, 227, 233, 0.44)', 'rgba(255, 255, 255, 0.9)', 72, 'salon,trial,strategy', 'credit,sample,trial,flash,selection,marketing,storage,salon,travel', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8305, 'diamond', '钻石会员', 4, '钻石会员', '适合重点经营客户，享有更高层级的服务响应与合作资源。', '开放专属客服、资源优先排期与高阶商务配套。', '距升级黑钻还需达成年度目标与重点合作认证。', '完成年度合作指标即可冲刺黑钻。', '查看年度目标', '钻石会员高阶礼遇', '/home/member/图片 8.png', '#2b3c73', '#586fbe', '#e8edff', '#4a61b2', 'rgba(74, 97, 178, 0.16)', 'rgba(246, 249, 255, 0.82)', 'rgba(74, 97, 178, 0.18)', 'rgba(154, 177, 255, 0.42)', 'rgba(246, 249, 255, 0.98)', 84, 'support,salon,strategy', 'credit,sample,trial,support,flash,selection,marketing,storage,salon,travel', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8306, 'blackDiamond', '黑钻会员', 5, '黑钻会员', '面向平台核心客户，提供顶级合作礼遇、优先资源与专属商务服务。', '解锁全量权益、黑钻专属宴请与年度合作优先级。', '当前已达最高等级，继续保持合作可享受黑钻尊享服务。', '黑钻年度礼遇已为你开启。', '查看黑钻礼遇', '黑钻会员顶级特权', '/home/member/图片 9.png', '#161c28', '#3c4b69', '#dde4f2', '#27334d', 'rgba(39, 51, 77, 0.14)', 'rgba(250, 251, 255, 0.84)', 'rgba(39, 51, 77, 0.16)', 'rgba(138, 160, 214, 0.36)', 'rgba(239, 244, 255, 0.92)', 100, 'support,salon,strategy', 'credit,sample,trial,support,flash,selection,marketing,storage,salon,travel,banquet', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO merchant_application_ai_report (
    id, application_id, risk_level, recommendation, analysis_summary, missing_document_keys, risk_flags,
    authenticity_score, completeness_score, compliance_score, report_status, analyzed_at, created_at, updated_at
)
KEY(id) VALUES
(8401, 8101, 'LOW', 'APPROVE', 'AI 已完成四类核心证件交叉校验，证件真实度高、有效期正常，未发现资质缺失，可进入人工复核并允许通过。', '', '证件信息一致,企业主体清晰', 95, 100, 96, 'READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8402, 8102, 'LOW', 'APPROVE', '该企业历史资料完整，进口报关单与检验检疫类证件状态正常，适合持续合作。', '', '资料完整,历史合作稳定', 97, 100, 98, 'READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8403, 8103, 'HIGH', 'REJECT', '营业执照经营范围与申报经营范围匹配度低，植检资料缺失，存在较高合规风险，建议驳回。', 'phytosanitaryCertificate', '经营范围不一致,植检证明缺失', 62, 58, 45, 'READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8404, 8104, 'HIGH', 'REJECT', '卫检证明已过期，植检证明缺失，当前不满足进口母婴类供货商入驻要求，应直接拦截。', 'phytosanitaryCertificate', '卫检过期,植检缺失,证照链路不完整', 66, 52, 41, 'READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8405, 8105, 'MEDIUM', 'REVIEW', '整体资料可用，但营业执照即将到期，建议通过后设置预警并限制高风险类目。', '', '营业执照临期,建议加强跟进', 88, 96, 79, 'READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO merchant_application_document (
    id, application_id, document_key, document_name, document_no, authenticity_status, expiry_date,
    expiry_status, document_status, risk_note, created_at, updated_at
)
KEY(id) VALUES
(8501, 8101, 'customsDeclaration', '进口报关单', 'CUS-2026-0801', 'AUTHENTIC', DATE '2027-12-31', 'VALID', 'READY', '海关编码与企业信息一致。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8502, 8101, 'healthCertificate', '卫检证明', 'HC-2026-0801', 'AUTHENTIC', DATE '2027-08-31', 'VALID', 'READY', '卫生检验结果正常。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8503, 8101, 'phytosanitaryCertificate', '植检证明', 'PC-2026-0801', 'AUTHENTIC', DATE '2027-08-31', 'VALID', 'READY', '适用该批次进口酒类辅料。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8504, 8101, 'businessLicense', '营业执照', 'BL-913301001', 'AUTHENTIC', DATE '2032-12-31', 'VALID', 'READY', '企业主体有效。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8505, 8102, 'customsDeclaration', '进口报关单', 'CUS-2026-0802', 'AUTHENTIC', DATE '2027-12-31', 'VALID', 'READY', '历史报关记录完整。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8506, 8102, 'healthCertificate', '卫检证明', 'HC-2026-0802', 'AUTHENTIC', DATE '2027-10-31', 'VALID', 'READY', '卫检批次可追溯。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8507, 8102, 'phytosanitaryCertificate', '植检证明', 'PC-2026-0802', 'AUTHENTIC', DATE '2027-10-31', 'VALID', 'READY', '植检信息匹配。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8508, 8102, 'businessLicense', '营业执照', 'BL-913302002', 'AUTHENTIC', DATE '2031-06-30', 'VALID', 'READY', '经营范围覆盖申报品类。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8509, 8103, 'customsDeclaration', '进口报关单', 'CUS-2026-0803', 'SUSPECT', DATE '2026-12-31', 'VALID', 'REQUIRES_REVIEW', '报关品类与申报经营范围不完全一致。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8510, 8103, 'healthCertificate', '卫检证明', 'HC-2026-0803', 'AUTHENTIC', DATE '2026-12-31', 'VALID', 'READY', '卫检可用。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8511, 8103, 'phytosanitaryCertificate', '植检证明', NULL, 'MISSING', NULL, 'MISSING', 'MISSING', '未上传植检证明。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8512, 8103, 'businessLicense', '营业执照', 'BL-913100003', 'AUTHENTIC', DATE '2029-04-30', 'VALID', 'READY', '营业执照有效。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8513, 8104, 'customsDeclaration', '进口报关单', 'CUS-2026-0804', 'AUTHENTIC', DATE '2027-03-31', 'VALID', 'READY', '报关资料可识别。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8514, 8104, 'healthCertificate', '卫检证明', 'HC-2025-0104', 'AUTHENTIC', DATE '2026-01-15', 'EXPIRED', 'REQUIRES_REVIEW', '卫检证明已过期。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8515, 8104, 'phytosanitaryCertificate', '植检证明', NULL, 'MISSING', NULL, 'MISSING', 'MISSING', '缺少植检证明。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8516, 8104, 'businessLicense', '营业执照', 'BL-914401004', 'AUTHENTIC', DATE '2030-05-31', 'VALID', 'READY', '营业执照有效。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8517, 8105, 'customsDeclaration', '进口报关单', 'CUS-2026-0805', 'AUTHENTIC', DATE '2027-11-30', 'VALID', 'READY', '进口单据完备。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8518, 8105, 'healthCertificate', '卫检证明', 'HC-2026-0805', 'AUTHENTIC', DATE '2027-11-30', 'VALID', 'READY', '卫检正常。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8519, 8105, 'phytosanitaryCertificate', '植检证明', 'PC-2026-0805', 'AUTHENTIC', DATE '2027-11-30', 'VALID', 'READY', '植检正常。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8520, 8105, 'businessLicense', '营业执照', 'BL-914403005', 'AUTHENTIC', DATE '2026-11-15', 'EXPIRING_SOON', 'REQUIRES_REVIEW', '营业执照 90 天内到期，建议设提醒。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO customer_portrait_snapshot (
    id, user_id, enterprise_id, segment_code, segment_name, primary_categories, pickup_frequency_per_month,
    avg_order_amount, repayment_days, recommended_policy, policy_tags, external_data_status, external_data_endpoint,
    last_synced_at, deleted, created_at, updated_at
)
KEY(id) VALUES
(8601, 101, NULL, 'POTENTIAL_STORE', '潜力小店', '进口酒水,节庆礼盒', 5.50, 3680.00, 18, '建议推送新人冲量包、白银会员升级政策与节庆礼盒专场。', '酒水,礼盒,拉新扶持', 'READY', '/api/external/erp/customer-metrics', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8602, 102, 8201, 'KEY_ACCOUNT', '优质大客户', '进口零食,酒饮,伴手礼', 14.00, 28600.00, 7, '建议推送钻石货盘、账期激励与平台招商优先排期。', '高复购,高客单,账期优', 'READY', '/api/external/erp/customer-metrics', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8603, 103, NULL, 'LOW_FREQUENCY', '低频散户', '跨境选品,仓配服务', 1.20, 980.00, 35, '建议推送低门槛试单包、爆款拼单和回款提速政策。', '低频,小额,需激活', 'PENDING', '/api/external/erp/customer-metrics', NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8604, 104, 8202, 'POTENTIAL_STORE', '潜力小店', '母婴,家庭消费品', 6.80, 5320.00, 16, '建议推送母婴爆款组合、阶梯返利和门店陈列支持。', '母婴,成长型,返利', 'READY', '/api/external/erp/customer-metrics', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8605, 105, NULL, 'LOW_FREQUENCY', '低频散户', '母婴,保健品', 0.80, 760.00, 42, '建议暂缓大额授信，优先推送合规资料补齐任务和小包试单政策。', '低频,高风险,待准入', 'PENDING', '/api/external/erp/customer-metrics', NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8606, 106, 8203, 'KEY_ACCOUNT', '优质大客户', '进口零食,饮品,礼赠', 11.50, 19800.00, 9, '建议推送黑钻候选政策、专属客服和高毛利礼赠货盘。', '高潜力,礼赠,稳定回款', 'READY', '/api/external/erp/customer-metrics', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8607, 107, 8201, 'KEY_ACCOUNT', '重点跟单', '进口零食,酒饮', 8.00, 12600.00, 10, '建议同步促销节奏、报价权限与订单跟进任务。', '采购协同,门店跟单', 'READY', '/api/external/erp/customer-metrics', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8608, 108, 8202, 'POTENTIAL_STORE', '门店经营', '母婴,家庭消费品', 4.50, 4680.00, 14, '建议推送门店活动素材、爆款陈列和促销节奏。', '门店运营,活动执行', 'READY', '/api/external/erp/customer-metrics', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8609, 109, 8203, 'KEY_ACCOUNT', '渠道执行', '进口饮品,礼赠', 7.50, 11200.00, 12, '建议推送高复购品类、客户跟进 SOP 与账期提醒。', '渠道执行,客户跟进', 'READY', '/api/external/erp/customer-metrics', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
