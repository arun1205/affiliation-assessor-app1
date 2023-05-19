let ADMIN_ROUTE_MAP = {};
let GROUND_INSPECTION = 'groundInspection';
let MANAGE_FORMS = 'manage-forms';

ADMIN_ROUTE_MAP.auth = "/auth";
ADMIN_ROUTE_MAP.loginModule = {
  login: `${ADMIN_ROUTE_MAP.auth}/login`,
  loginOtp: `${ADMIN_ROUTE_MAP.auth}/loginOtp`,
  register: `${ADMIN_ROUTE_MAP.auth}/register`,
  registerOtp: `${ADMIN_ROUTE_MAP.auth}/registerOtp`,
};


ADMIN_ROUTE_MAP.adminModule = {
  dashboard: "/",
  manageUsers: {
    list: "manageUsers/list",
    viewForm:"manageUsers/view-form"
  },
  manageForms: {
    home: `/${MANAGE_FORMS}`,
    overview: `/${MANAGE_FORMS}/overview`,
    createForm: `/${MANAGE_FORMS}/create-form`,
    uploadCSV: `/${MANAGE_FORMS}/upload`
  },
  desktopAnalysis: {
    list: "desktopAnalysis/list",
    viewForm: "desktopAnalysis/view"
  },
  onGroundInspection: {
    home: `/${GROUND_INSPECTION}`,
    list: `/${GROUND_INSPECTION}/list`,
    viewForm: `/${GROUND_INSPECTION}/view`,
  },
  certificateManagement: {
    list: "certificate/list",
  },
  scheduleManagement: {
    list: "schedule/list",
  },
};


// Desktop Analysis Routes
ADMIN_ROUTE_MAP.desktopAnalysis = {
  home: "/desktopAnalysis",
};

ADMIN_ROUTE_MAP.desktopAnalysis= {
  list: `${ADMIN_ROUTE_MAP.desktopAnalysis.home}/list`,
  viewForm: `${ADMIN_ROUTE_MAP.desktopAnalysis.home}/view`,
};

//Manage Users Routes
ADMIN_ROUTE_MAP.manageUsers = {
  home: "/manageUsers",
  
};

ADMIN_ROUTE_MAP.manageUsers = {
  // list: `${ADMIN_ROUTE_MAP.manageUsers.home}/list`,
  viewForm: `${ADMIN_ROUTE_MAP.manageUsers.home}/view`,
};

export default ADMIN_ROUTE_MAP;
