import axios from 'axios';
import { ensureHTTPS } from '../utils/utils';
import { getApiToken } from '../storage/storage';

export const BASE_URL = 'https://dev.api.sltechnocrats.click/api';
export const OHIF_SERVER_URL = 'https://dev.pacs.sltechnocrats.click';
export const SOCKET_SERVER_URL = 'https://dev.socket.sltechnocrats.click';
export const AWS_BUCKET_URL = 'https://smaro-prod-bucket.s3.amazonaws.com';

export const api = {
  get: async (url: string, params?: any) => {
    const token = getApiToken();
    url = ensureHTTPS(url);
    const config = {
      headers: {
        Token: token,
      },
      params,
    };
    return axios.get(url, config);
  },

  post: async (url: string, formData: any, headers = {}) => {
    const token = getApiToken();
    const config = {
      method: 'post',
      url: ensureHTTPS(url),
      headers: {
        ...headers,
        Token: token,
      },
      data: formData,
    };
    return axios(config);
  },
  put: async (url: string, params: any, headers = {}) => {
    const token = getApiToken();
    const config = {
      method: 'put',
      url: ensureHTTPS(url),
      headers: {
        ...headers,
        Token: token,
      },
      data: params,
    };
    return axios(config);
  },
  delete: async (url: string, params: any, headers = {}) => {
    const token = getApiToken();
    const config = {
      method: 'delete',
      url: ensureHTTPS(url),
      headers: {
        ...headers,
        Token: token,
      },
      data: params,
    };
    return axios(config);
  },
  endpoints: {
    auth: {
      login: BASE_URL + '/auth/radiologist/login',
      forgot_password: BASE_URL + '/auth/radiologist/forget-password',
      verify_otp: BASE_URL + '/auth/radiologist/verify-otp',
      reset_password: BASE_URL + '/auth/radiologist/reset-password',
      online_status: BASE_URL + '/radiologist/availability/status/check',
      change_online_status: BASE_URL + '/radiologist/availability/status/change',
    },
    profile: {
      get: BASE_URL + '/radiologist',
      update: BASE_URL + '/radiologist/update',
      update_profile: BASE_URL + '/profiles/radiologist',
      change_password: BASE_URL + '/auth/radiologist/change-password',
    },
    patients: {
      get: BASE_URL + '/patient',
      create: BASE_URL + '/patient/create',
      update: BASE_URL + '/patient/update',
      delete: BASE_URL + '/patient/deactivate',
    },
    report: {
      by_patient_id: BASE_URL + '/diagnostics/patient/report/by-patient-id',
      all: BASE_URL + '/patient/report/all',
      get: BASE_URL + '/diagnostics/patient/report',
      view: BASE_URL + '/diagnostics/patient/report/by-patient-id',
      create: BASE_URL + '/diagnostics/patient/report/create',
      update: BASE_URL + '/diagnostics/patient/report/update',
      delete: BASE_URL + '/patient/deactivate',
      duplicate: BASE_URL + '/radiologist/create/multiple-report',
      get_multiple_reports: BASE_URL + '/get/multiple-report',
    },
    report_analysis: {
      get: {
        id: BASE_URL + '/patient/report/analysis',
        radiologist: BASE_URL + '/radiologist/report/analysis',
        patient: BASE_URL + '/radiologist/report/analysis/patient',
      },
      update: BASE_URL + '/patient/report/analysis/update',
      reportPDF: BASE_URL + '/patient/report/analysis/pdf',
    },
    branch: {
      get: BASE_URL + '/branch/get-all-branches',
      create: BASE_URL + '/branch/create',
      update: BASE_URL + '/branch/update',
      delete: BASE_URL + '/branch/delete',
      get_by_report_id: BASE_URL + '/branch/by/report-id',
    },
    dashboard: {
      preview: BASE_URL + '/dashboard/preview',
      report: BASE_URL + '/dashboard/report/analysis/completed/all',
    },
    upload: {
      image: BASE_URL + '/upload/picture',
      document: BASE_URL + '/upload/picture',
    },
    organisation: {
      get: BASE_URL + '/organisation/get-all',
    },
    state: {
      get: BASE_URL + '/getStates',
    },
    modality: {
      get: BASE_URL + '/modality',
    },
    test_type: {
      get: BASE_URL + '/test-type',
      get_by_modality: BASE_URL + '/test-type/by/modality-id',
    },
    dicom: {
      upload: BASE_URL + '/upload/dicom/file ',
    },
    wallet: {
      price: {
        create: BASE_URL + '/test/price',
        get: BASE_URL + 'client/test/price',
        update: BASE_URL + '/test/price',
      },
    },
    template: {
      create: BASE_URL + '/report-templates',
      get_all: BASE_URL + '/report-templates/get-all',
      get: BASE_URL + '/report-templates',
      update: BASE_URL + '/report-templates',
      get_radiologist_templates: BASE_URL + '/report-templates/template/by/radiologist-id',
      search: BASE_URL + '/report-templates/radiologist/template/search',
      delete: BASE_URL + '/report-templates/delete',
    },
    ml: {
      get: BASE_URL + '/report-ml',
    },
    medical_council: {
      get: BASE_URL + '/medical-councils',
    },
    medical_degree: {
      get: BASE_URL + '/medical-degrees',
    },
    medical_colleges: {
      get: BASE_URL + '/medical-colleges',
    },
    speciality: {
      get: BASE_URL + '/speciality',
    },
    hospitals: {
      get: BASE_URL + '/hospitals',
    },
    radiologist: {
      get: BASE_URL + '/radiologist',
    },
    newReportTemplate: {
      getNewReportTemplate: BASE_URL + '/new/template/report',
      getSections: BASE_URL + '/master/template/section',
    },
    message: {
      init: BASE_URL + '/chat/sender/init/conversation',
      get: BASE_URL + '/chat/get/messages',
      categories: BASE_URL + '/chat/categories',
      startConversation: BASE_URL + '/chat/sender/init/conversation',
      conversations: BASE_URL + '/chat/sender/conversations',
    },
    tickets: {
      ticketList: BASE_URL + '/chat/sender/conversations',
    },
    report_images: {
      create: BASE_URL + '/patient/report/analysis/image/create',
      get: BASE_URL + '/patient/report/analysis/image',
      update: BASE_URL + '/patient/report/analysis/image/update',
    },
    radiologistSignature: {
      create: BASE_URL + '/radiologist/signature/create',
      get: BASE_URL + '/radiologist/signature',
      update: BASE_URL + '/radiologist/signature/update',
      delete: BASE_URL + '/radiologist/signature/delete',
    },
    getDocument: {
      pdf: BASE_URL + '/patient/report/pdf',
      docx: BASE_URL + '/patient/report/docx',
    },
    xrayViewer: {
      xrayImages: BASE_URL + '/orthanc/study/blob-images',
    },

    authCheck: BASE_URL + '/check-auth-status',
    report_chat: {
      chat: BASE_URL + '/report/chat',
    },
    notification: {
      get: BASE_URL + '/notification/report/radiologist',
      read: BASE_URL + '/notification/report/radiologist/read',
    },
  },
};
