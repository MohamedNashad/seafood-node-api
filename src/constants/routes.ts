export const UserRoutesUrls = {
  REGISTER: "/register",
  CREATE_USER_URL: "/create-user",
  GET_AUTHORIZED_USERS_URL: "/get-authorized-users",
  GET_USER_BY_ID_URL: "/get-user-by-id",
  UPDATE_USER_BY_ID_URL: "/update-user-by-id",
  SOFT_DELETE_USER_BY_ID_URL: "/soft-delete-user-by-id",
  ACTIVATE_USER_BY_ID_URL: "/activate-user-by-id",
  DELETE_USER_BY_ID_URL: "/delete-user-by-id",
  BULK_SOFT_DELETE_USERS_BY_IDS_URL: "/bulk-soft-delete-users-by-ids",
  BULK_DELETE_USERS_BY_IDS_URL: "/bulk-delete-users-by-ids",
  GET_ALL_USERS_URL: "/get-all-users",
  DYNAMIC_USER_ID: ":userId",
};

export const AuthRoutesUrls = {
  LOGIN: "/login",
  LOGOUT: "/logout",
  VALIDATE_TOKEN: "/validate-token",
};

export const PermissionRoutesUrls = {
  CREATE_PERMISSION_URL: "/create-permission",
  GET_AUTHORIZED_PERMISSIONS_URL: "/get-authorized-permissions",
  GET_PERMISSION_BY_ID_URL: "/get-permission-by-id",
  UPDATE_PERMISSION_BY_ID_URL: "/update-permission-by-id",
  SOFT_DELETE_PERMISSION_BY_ID_URL: "/soft-delete-permission-by-id",
  ACTIVATE_PERMISSION_BY_ID_URL: "/activate-permission-by-id",
  DELETE_PERMISSION_BY_ID_URL: "/delete-permission-by-id",
  BULK_SOFT_DELETE_PERMISSIONS_BY_IDS_URL:
    "/bulk-soft-delete-permissions-by-ids",
  BULK_DELETE_PERMISSIONS_BY_IDS_URL: "/bulk-delete-permissions-by-ids",
  GET_ALL_PERMISSIONS_URL: "/get-all-permissions",
  DYNAMIC_PERMISSION_ID: ":permissionId",
};

export const RoleRoutesUrls = {
  CREATE_ROLE_URL: "/create-role",
  GET_AUTHORIZED_ROLES_URL: "/get-authorized-roles",
  GET_ROLE_BY_ID_URL: "/get-role-by-id",
  UPDATE_ROLE_BY_ID_URL: "/update-role-by-id",
  SOFT_DELETE_ROLE_BY_ID_URL: "/soft-delete-role-by-id",
  ACTIVATE_ROLE_BY_ID_URL: "/activate-role-by-id",
  DELETE_ROLE_BY_ID_URL: "/delete-role-by-id",
  BULK_SOFT_DELETE_ROLES_BY_IDS_URL: "/bulk-soft-delete-roles-by-ids",
  BULK_DELETE_ROLES_BY_IDS_URL: "/bulk-delete-roles-by-ids",
  GET_ALL_ROLES_URL: "/get-all-roles",
  GET_ALL_ROLES_WITHOUT_AUTHENTICATION_URL: '/get-all-roles-without-authentication',
  DYNAMIC_ROLE_ID: ":roleId",
};

export const OrderRoutesUrls = {
  CREATE_PENDING_ORDER_URL: "/create-pending-order",
  VERIFY_PAYMENT_URL: "/verify-payment",
  CREATE_ORDER_URL: "/create-order",
  GET_AUTHORIZED_ORDERS_URL: "/get-authorized-orders",
  GET_ORDER_BY_ID_URL: "/get-order-by-id",
  UPDATE_ORDER_BY_ID_URL: "/update-order-by-id",
  SOFT_DELETE_ORDER_BY_ID_URL: "/soft-delete-order-by-id",
  ACTIVATE_ORDER_BY_ID_URL: "/activate-order-by-id",
  DELETE_ORDER_BY_ID_URL: "/delete-order-by-id",
  BULK_SOFT_DELETE_ORDERS_BY_IDS_URL: "/bulk-soft-delete-orders-by-ids",
  BULK_DELETE_ORDERS_BY_IDS_URL: "/bulk-delete-orders-by-ids",
  GET_ALL_ORDERS_URL: "/get-all-orders",
  GET_USER_ORDERS_URL: "/get-user-orders",
  DYNAMIC_ORDER_ID: ":orderId",
};

export const RolePermissionRoutesUrls = {
  ASSIGN_PERMISSIONS_TO_ROLE_URL: "/assign-permissions-to-role",
  GET_ROLE_WITH_PERMISSIONS_URL: "/get-role-with-permissions",
};

export const UserRoleRoutesUrls = {
  ASSIGN_ROLES_TO_USER_URL: "/assign-roles-to-user",
  GET_USER_WITH_ROLES_URL: "/get-user-with-roles",
};

export const UserRoleAndPermissionRoutesUrls = {
  LOGGED_IN_USER_ASSIGNED_ROLES_AND_PERMISSIONS_URL:
    "/logged-in-user-assigned-roles-and-permissions",
};

export const ClientRoutesUrls = {
  CREATE_CLIENT_URL: "/create-client",
  GET_AUTHORIZED_CLIENTS_URL: "/get-authorized-clients",
  GET_CLIENT_BY_ID_URL: "/get-client-by-id",
  UPDATE_CLIENT_BY_ID_URL: "/update-client-by-id",
  SOFT_DELETE_CLIENT_BY_ID_URL: "/soft-delete-client-by-id",
  ACTIVATE_CLIENT_BY_ID_URL: "/activate-client-by-id",
  DELETE_CLIENT_BY_ID_URL: "/delete-client-by-id",
  BULK_SOFT_DELETE_CLIENTS_BY_IDS_URL: "/bulk-soft-delete-clients-by-ids",
  BULK_DELETE_CLIENTS_BY_IDS_URL: "/bulk-delete-clients-by-ids",
  GET_ALL_CLIENTS_URL: "/get-all-clients",
  DYNAMIC_CLIENT_ID: ":clientId",
};

export const AboutRoutesUrls = {
  CREATE_ABOUT_URL: "/create-about",
  GET_AUTHORIZED_ABOUT_URL: "/get-authorized-about",
  GET_ABOUT_BY_ID_URL: "/get-about-by-id",
  UPDATE_ABOUT_BY_ID_URL: "/update-about-by-id",
  SOFT_DELETE_ABOUT_BY_ID_URL: "/soft-delete-about-by-id",
  ACTIVATE_ABOUT_BY_ID_URL: "/activate-about-by-id",
  DELETE_ABOUT_BY_ID_URL: "/delete-about-by-id",
  BULK_SOFT_DELETE_ABOUT_BY_IDS_URL: "/bulk-soft-delete-about-by-ids",
  BULK_DELETE_ABOUT_BY_IDS_URL: "/bulk-delete-about-by-ids",
  GET_ALL_ABOUT_URL: "/get-all-about",
  DYNAMIC_ABOUT_ID: ":aboutId",
};

export const GalleryRoutesUrls = {
  CREATE_GALLERY_URL: "/create-gallery",
  GET_AUTHORIZED_GALLERIES_URL: "/get-authorized-galleries",
  GET_ALL_GALLERIES_URL: "/get-all-galleries",
  GET_GALLERY_BY_ID_URL: "/get-gallery-by-id",
  UPDATE_GALLERY_BY_ID_URL: "/update-gallery-by-id",
  SOFT_DELETE_GALLERY_BY_ID_URL: "/soft-delete-gallery-by-id",
  ACTIVATE_GALLERY_BY_ID_URL: "/activate-gallery-by-id",
  DELETE_GALLERY_BY_ID_URL: "/delete-gallery-by-id",
  BULK_SOFT_DELETE_GALLERY_BY_IDS_URL: "/bulk-soft-delete-galleries-by-ids",
  BULK_DELETE_GALLERIES_BY_IDS_URL: "/bulk-delete-galleries-by-ids",
  DYNAMIC_GALLERY_ID: ":galleryId",
};

export const ProductRoutesUrls = {
  CREATE_PRODUCT_URL: "/create-product",
  GET_AUTHORIZED_PRODUCTS_URL: "/get-authorized-products",
  GET_ALL_PRODUCTS_URL: "/get-all-products",
  GET_PRODUCT_BY_ID_URL: "/get-product-by-id",
  UPDATE_PRODUCT_BY_ID_URL: "/update-product-by-id",
  SOFT_DELETE_PRODUCT_BY_ID_URL: "/soft-delete-product-by-id",
  ACTIVATE_PRODUCT_BY_ID_URL: "/activate-product-by-id",
  DELETE_PRODUCT_BY_ID_URL: "/delete-product-by-id",
  BULK_SOFT_DELETE_PRODUCT_BY_IDS_URL: "/bulk-soft-delete-products-by-ids",
  BULK_DELETE_PRODUCTS_BY_IDS_URL: "/bulk-delete-products-by-ids",
  DYNAMIC_PRODUCT_ID: ":productId",
};

export const SliderRoutesUrls = {
  CREATE_SLIDER_URL: "/create-slider",
  GET_AUTHORIZED_SLIDERS_URL: "/get-authorized-sliders",
  GET_ALL_SLIDERS_URL: "/get-all-sliders",
  GET_SLIDER_BY_ID_URL: "/get-slider-by-id",
  GET_SLIDERS_BY_GROUP_ID_URL: "/get-slider-by-group-id",
  UPDATE_SLIDER_BY_ID_URL: "/update-slider-by-id",
  UPDATE_SLIDER_BY_GROUP_ID_URL: "/update-slider-by-group-id",
  SOFT_DELETE_SLIDER_BY_ID_URL: "/soft-delete-slider-by-id",
  ACTIVATE_SLIDER_BY_ID_URL: "/activate-slider-by-id",
  DELETE_SLIDER_BY_ID_URL: "/delete-slider-by-id",
  DELETE_SLIDER_BY_GROUP_ID_URL: "/delete-slider-by-group-id",
  BULK_SOFT_DELETE_SLIDER_BY_IDS_URL: "/bulk-soft-delete-slider-by-ids",
  BULK_DELETE_SLIDER_BY_IDS_URL: "/bulk-delete-slider-by-ids",
  DYNAMIC_SLIDER_ID: ":sliderId",
  DYNAMIC_GROUP_ID: ":groupId",
};

export const ServiceRoutesUrls = {
  CREATE_SERVICE_URL: "/create-service",
  GET_AUTHORIZED_SERVICES_URL: "/get-authorized-services",
  GET_ALL_SERVICES_URL: "/get-all-services",
  GET_SERVICE_BY_ID_URL: "/get-service-by-id",
  UPDATE_SERVICE_BY_ID_URL: "/update-service-by-id",
  SOFT_DELETE_SERVICE_BY_ID_URL: "/soft-delete-service-by-id",
  ACTIVATE_SERVICE_BY_ID_URL: "/activate-service-by-id",
  DELETE_SERVICE_BY_ID_URL: "/delete-service-by-id",
  BULK_SOFT_DELETE_SERVICE_BY_IDS_URL: "/bulk-soft-delete-service-by-ids",
  BULK_DELETE_SERVICE_BY_IDS_URL: "/bulk-delete-service-by-ids",
  DYNAMIC_SERVICE_ID: ":serviceId",
  DYNAMIC_GROUP_ID: ":groupId",
};

export const EmployeeRoutesUrls = {
  CREATE_EMPLOYEE_URL: "/create-employee",
  GET_AUTHORIZED_EMPLOYEES_URL: "/get-authorized-employees",
  GET_ALL_EMPLOYEES_URL: "/get-all-employees",
  GET_EMPLOYEE_BY_ID_URL: "/get-employee-by-id",
  UPDATE_EMPLOYEE_BY_ID_URL: "/update-employee-by-id",
  SOFT_DELETE_EMPLOYEE_BY_ID_URL: "/soft-delete-employee-by-id",
  ACTIVATE_EMPLOYEE_BY_ID_URL: "/activate-employee-by-id",
  DELETE_EMPLOYEE_BY_ID_URL: "/delete-employee-by-id",
  BULK_SOFT_DELETE_EMPLOYEE_BY_IDS_URL: "/bulk-soft-delete-employee-by-ids",
  BULK_DELETE_EMPLOYEE_BY_IDS_URL: "/bulk-delete-employee-by-ids",
  DYNAMIC_EMPLOYEE_ID: ":employeeId",
  DYNAMIC_GROUP_ID: ":groupId",
};

export const FileRoutesUrls = {
  UPLOAD_FILES_URL: "/upload-files",
  GET_FILE_BY_ID_URL: "/get-file-by-id",
  UPDATE_FILE_BY_ID_URL: "/update-file-by-id",
  DELETE_FILE_BY_ID_URL: "/delete-file-by-id",
  BULK_DELETE_FILES_BY_IDS_URL: "/bulk-delete-file-by-ids",
  GET_ALL_FILES_URL: "/get-all-files",
  DYNAMIC_FILE_ID: ":fileId",
};

export const ApiRouteConfigs = {
  API_MODULE: "api",
  USERS_ROUTE: "users",
  AUTH_ROUTE: "auth",
  CLIENT_ROUTE: "client",
  PERMISSIONS_ROUTE: "permissions",
  ROLES_ROUTE: "roles",
  ROLE_PERMISSIONS_ROUTE: "role-permissions",
  USER_ROLES_ROUTE: "user-roles",
  USER_ROLES_AND_PERMISSIONS_ROUTE: "user-roles-and-permissions",
  ENQUIRY: "enquiry",
  ABOUT: "about",
  GALLERY: "gallery",
  PRODUCT: "product",
  SLIDER: "slider",
  EMPLOYEE: "employee",
  SERVICE: "service",
  CONTACT: "contact",
  FILE: "file",
  WEB: "web",
  ORDER: "order",
  PAYMENT: "payment",
  DYNAMIC_ID: ":id",
};

export const WebsiteRoutesUrls = {
  GET_WEBSITE_CLIENT_DETAILS: "/get-website-client-details",
  DYNAMIC_CLIENT_WEB_ID: ":webClientId",
};

export const PaymentRoutesUrls = {
  START: "/start",
  NOTIFY: "/notify",
};
