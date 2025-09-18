import React, { Fragment, useEffect, useState } from 'react';
import LabelHWrap from '../Common/LabelHWrap';

import CustomInput from '../Common/CustomInput';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { LuCopyPlus } from 'react-icons/lu';
import { TbFileDownload } from 'react-icons/tb';
import classNames from 'classnames';
import { MdOutlineOpenInNew } from 'react-icons/md';
import { initialAnalysisValues, ReportAnalysisTypes } from '../../types/ReportAnalysisTypes';
import useDispatchAction from '../../hooks/useDispatchAction';
import useAuth from '../../hooks/useAuth';
import useDrafts from '../../hooks/useDrafts';
import * as _ from 'lodash';
import { isValidUrl } from '../../utils/utils';
import { api, AWS_BUCKET_URL, BASE_URL } from '../../api/api';
import { removeReportFromDraft, setReportInDraft } from '../../store/reducers/drafts.slice';
import { showErrorToast, showSuccessToast } from '../../utils/notify';
import CustomSelectBox from '../Common/CustomSelectBox';
import DiagnosisSection from './DiagnosisSection';
import ConfirmModal from './ConfirmModal';

interface TemplateDataTypes {
  id: number;
  test_type_id: number;
  modality_id: number;
  report_template_name: string;
  template: string;
}

interface OptionsTypes {
  value: any;
  label: string;
  color?: string;
}

type TemplateOptionTypes = TemplateDataTypes & OptionsTypes;

interface DefaultSectionDataTypes {
  sectionName: string;
  dataName: keyof ReportAnalysisTypes;
  isEditable: boolean;
}

interface Props {
  analysis: ReportAnalysisTypes;
}

const DataLabel = ({ label, value }: { label: string; value: any }) => {
  return (
    <div className="w-full">
      <LabelHWrap label={label}>
        <p className="ml-5 font-bold text-black lg:ml-0">{value}</p>
      </LabelHWrap>
    </div>
  );
};

const ViewReportTab: React.FC<Props> = ({ analysis }) => {
  const dispatch = useDispatchAction();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { drafts } = useDrafts();
  const [hoverImage, setHoverImage] = useState<string | null>(null);
  const defaultSections: DefaultSectionDataTypes[] = [
    {
      sectionName: 'Clinical Information',
      dataName: 'clinical_history',
      isEditable: false,
    },
    { sectionName: 'Report', dataName: 'report_template', isEditable: true },
  ];

  const { values, setFieldValue, handleSubmit } = useFormik({
    initialValues: initialAnalysisValues,
    onSubmit: async (params: ReportAnalysisTypes) => {
      await updatePatientReportAnalysis(params);
    },
  });

  const [templates, setTemplates] = useState<TemplateOptionTypes[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const setFormikValues = (params: ReportAnalysisTypes) => {
    for (const [key, value] of Object.entries(params)) {
      if (key === 'PatientID') {
        const patientId = _.isString(params.PatientID)
          ? params.PatientID
          : (params.patient_id ?? '');
        void setFieldValue('PatientID', patientId);
        continue;
      }
      if (key === 'referral_doctor') {
        const doctor = _.isString(params.referral_doctor)
          ? params.referral_doctor
          : (params.doctor_name ?? '');
        void setFieldValue('referral_doctor', doctor);
        continue;
      }
      if (key === 'results_type') {
        void setFieldValue(key, _.isString(value) ? value : 'Normal');
        continue;
      }
      console.log(key, value);
      void setFieldValue(key, value);
    }
  };

  const getUrl = (url: string) => {
    return isValidUrl(url) ? url : `${AWS_BUCKET_URL}/${url}`;
  };

  const onSelectTemplate = (option: TemplateOptionTypes) => {
    void setFieldValue('modality_id', option.modality_id);
    void setFieldValue('test_type_id', option.test_type_id);
    void setFieldValue('template_id', option.id);
    void setFieldValue('report_template', option.template);
    void setFieldValue('report_title', option.label);
    void setFieldValue('template.value', option.value);
  };

  const saveAsDraft = (params: ReportAnalysisTypes) => {
    dispatch(setReportInDraft(params));
  };

  const removeFromDraft = (id: number) => {
    dispatch(removeReportFromDraft(id));
  };

  const getTemplates = async (modality_id: number) => {
    try {
      if (!_.isNumber(user?.id)) {
        showErrorToast('Invalid User Id');
        return;
      }
      const headers = {
        'Content-Type': 'application/json',
      };
      const params = JSON.stringify({
        radiologist_id: analysis.radiologist_id,
      });
      const { data: apiData, status: apiStatus } = await api.post(
        api.endpoints.template.search,
        params,
        headers
      );

      if (apiStatus === 200) {
        const { statusCode, data } = apiData;
        if (statusCode === 200) {
          let filtered: TemplateOptionTypes[] = data.map((item: TemplateDataTypes) => {
            return {
              id: item.id,
              label: item.report_template_name,
              value: item.id,
              test_type_id: item.test_type_id,
              modality_id: item.modality_id,
              template: item.template,
            };
          });

          if (_.isNumber(modality_id)) {
            filtered = filtered.filter(item => item.modality_id === modality_id);
          }

          setTemplates(filtered);
        } else {
          showErrorToast('Report templates not found,please add some templates');
        }
      }
    } catch (e) {
      showErrorToast('Report templates not found,please add some templates');
    }
  };

  const createReportImages = async () => {
    const params = values.images.map(item => {
      return { report_analysis_id: analysis.report_analysis_id, image: item };
    });
    const payload = { reportImages: params };
    try {
      const { data: apiData } = await api.post(api.endpoints.report_images.create, payload);
      const { statusCode } = apiData;

      if (statusCode !== 200) {
        showErrorToast('Something went wrong');
      }
    } catch (e) {
      showErrorToast('Something went wrong,please try again');
    }
  };

  const updatePatientReportAnalysis = async (params: ReportAnalysisTypes) => {
    try {
      if (!params.id) {
        showErrorToast('Invalid Report Id');
        return;
      }
      if (!_.isString(params?.patient_study_id)) {
        showErrorToast('Invalid Study Id');
        return;
      }

      if (!_.isString(params?.patient_study_instance_id)) {
        showErrorToast('Invalid Study Instance Id');
        return;
      }
      if (!params.report_analysis_id) {
        showErrorToast('Invalid Report Analysis ID');
        return;
      }
      const headers = {
        'Content-Type': 'application/json',
      };
      const { status: apiStatus, data: apiData } = await api.post(
        api.endpoints.report_analysis.update,
        JSON.stringify(params),
        headers
      );
      if (apiStatus === 200) {
        const { statusCode, message } = apiData;
        if (statusCode === 200) {
          removeFromDraft(params.id);
          showSuccessToast(message);
          if (_.isArray(values.images)) {
            await handleReportImages();
            await getPatientReport(values.id);
          }
        }
      } else {
        showErrorToast('Failure! Patient Report Not Saved');
      }
    } catch (e) {
      showErrorToast('Something went wrong,please try again');
    }
  };

  const createDuplicateReport = async (params: { id: number }) => {
    try {
      if (!_.isNumber(params?.id)) {
        showErrorToast('Invalid Report Id');
        return;
      }
      if (!_.isNumber(user?.id)) {
        showErrorToast('Invalid User Id');
        return;
      }
      const headers = {
        'Content-Type': 'application/json',
      };
      const formData = {
        id: params.id,
        radiologist_id: user.id,
      };
      const { status: apiStatus, data: apiData } = await api.post(
        api.endpoints.report.duplicate,
        JSON.stringify(formData),
        headers
      );
      if (apiStatus === 200) {
        const { statusCode, message, error, data } = apiData;
        if (statusCode === 200 && _.isNumber(data?.id)) {
          setShowConfirmModal(false);
          showSuccessToast(message);
          navigate('/patient-report-view/' + data.id);
        } else {
          showErrorToast(error);
        }
      } else {
        showErrorToast('Failed to create new report');
      }
    } catch (e) {
      showErrorToast('Something went wrong,please try again');
    }
  };

  const getPatientReport = async (id: number) => {
    if (!_.isNumber(id)) {
      showErrorToast('Invalid Report Id');
      return;
    }
    try {
      const API_URL = api.endpoints.report.get + '/' + id;
      const { status: apiStatus, data: apiData } = await api.get(API_URL, {});

      if (apiStatus === 200) {
        const { statusCode, data } = apiData;
        if (statusCode === 200) {
          if (_.isArray(data)) {
            const result: ReportAnalysisTypes = data[0];
            setFormikValues(result);
            await getTemplates(result?.modality_id);
          } else {
            // showErrorToast('Unable to fetch patient report');
          }
        } else {
          // showErrorToast('Unable to fetch patient report');
        }
      }
    } catch (e) {
      // showErrorToast('Unable to fetch patient report');
    }
  };

  const updateReportImages = async (data: string[]) => {
    const params = data.map(item => {
      return { report_analysis_id: values.report_analysis_id, image: item };
    });
    const payload = {
      report_analysis_id: values.report_analysis_id,
      reportImages: params,
    };
    try {
      const { data: apiData } = await api.put(api.endpoints.report_images.update, payload);
      const { statusCode } = apiData;
      if (statusCode !== 200) {
        showErrorToast('Something went wrong');
      }
    } catch (e) {
      showErrorToast('Update failed');
    }
  };

  const handleReportImages = async () => {
    if (!values.images.length) {
      await updateReportImages([]);
      return;
    }

    const flag = values.images.find(item => item.includes(AWS_BUCKET_URL));
    if (flag) {
      const filtered_images = values.images.map(item => {
        return item.replace(`${AWS_BUCKET_URL}/`, '');
      });
      await updateReportImages(filtered_images);
      return;
    }
    await createReportImages();
  };

  const getReportStatus = (status: string) => {
    if (status === 'Inprocess') {
      return 'In Progress';
    }
    return status;
  };

  useEffect(() => {
    if (_.isNumber(analysis.id)) {
      void (async () => {
        const draft = drafts.find(item => item.id === analysis.id);
        if (draft && _.isNumber(draft.id)) {
          setFormikValues(draft);
          await getTemplates(draft?.modality_id);
        } else {
          await getPatientReport(analysis.id);
        }
      })();
    }
  }, [analysis]);

  const ORTHANC_URL = `${BASE_URL}/orthanc/study/files/${analysis.patient_study_id}`;

  const handleDownload = () => {
    const anchor = document.createElement('a');
    anchor.href = ORTHANC_URL;
    anchor.target = '_blank'; // Opens in a new tab to ensure the page doesn't reload
    anchor.click();
  };

  const openNewTab = (image: string) => {
    window.open(image, '_blank');
  };

  return (
    <Fragment>
      <div className="sticky top-0 mb-2 flex w-full min-w-[80rem] flex-col content-center items-center justify-between bg-white py-2 align-middle md:flex-row">
        {_.isNumber(values?.id) && (
          <div className="flex content-center items-center justify-between gap-x-1 align-middle">
            {_.isString(analysis.patient_study_id) && (
              <button
                onClick={() => handleDownload()}
                className="flex min-w-max flex-row items-center justify-center gap-1 rounded-lg !bg-purple-900 p-1.5 text-xs font-medium text-white transition hover:bg-purple-800 focus:outline-none sm:px-3"
              >
                <TbFileDownload
                  size={15}
                  className="text-white"
                />
                <span className="text-white">Download DCM File</span>
              </button>
            )}
            <button
              className="w-full rounded bg-blue-700 p-1.5 text-sm font-semibold text-white sm:w-auto"
              onClick={() => saveAsDraft(values)}
            >
              Save As Draft
            </button>
            <button
              className="w-full rounded bg-green-700 p-1.5 text-sm font-semibold text-white sm:w-auto"
              onClick={() => handleSubmit()}
            >
              Dispatch Report
            </button>
          </div>
        )}
      </div>

      <div className="w-full rounded border border-gray-400 p-1">
        <div className="w-full border-gray-400 bg-purple-200 p-1">
          <div className="mb-4 grid w-full grid-cols-1 gap-y-1 sm:grid-cols-2">
            <DataLabel
              label="Patient Id"
              value={values?.patient_id}
            />
            <DataLabel
              label="Name"
              value={values?.patient_name}
            />
            <DataLabel
              label="Gender"
              value={values?.gender}
            />
            <DataLabel
              label="Age"
              value={values?.age}
            />
            {/* <DataLabel label="Diagnostics" value={values?.branch_name} /> */}
            <DataLabel
              label="Doctor"
              value={values.referral_doctor}
            />
            <DataLabel
              label="Radiologist"
              value={values?.radiologist_name}
            />
            <DataLabel
              label="Priority"
              value={values?.priority_type}
            />
            <DataLabel
              label="Modality"
              value={values?.modality}
            />
            <DataLabel
              label="Test Type"
              value={values?.test_type}
            />
            <DataLabel
              label="Report Status"
              value={getReportStatus(values?.report_status)}
            />
          </div>
          <div className="grid w-full gap-y-3">
            <LabelHWrap label="Template">
              <CustomSelectBox
                label="Select Template"
                options={templates}
                setValue={option => onSelectTemplate(option)}
                value={values.template.value}
              />
            </LabelHWrap>
            <LabelHWrap label="Report Title">
              <CustomInput
                value={values.report_title}
                onChange={e => setFieldValue('report_title', e.target.value)}
                placeholder="Enter Report Title"
              />
            </LabelHWrap>
          </div>
        </div>

        <div>
          {values.images?.length ? (
            <h4 className="mb-2 text-sm font-bold text-black">Prescription</h4>
          ) : null}
          <div className="flex flex-wrap gap-10">
            {values.images?.length
              ? values.images.map(item => {
                  return (
                    <div
                      key={item}
                      className="group relative"
                      onMouseEnter={() => setHoverImage(item)}
                      onMouseLeave={() => setHoverImage(null)}
                    >
                      <img
                        className={classNames(
                          'w-40 rounded object-contain',
                          hoverImage === item && 'opacity-50'
                        )}
                        src={getUrl(item)}
                        alt="Uploaded file"
                      />
                      {hoverImage === item && (
                        <button
                          onClick={() => openNewTab(getUrl(item))}
                          className="absolute inset-0 flex w-full items-center justify-center gap-4 rounded bg-black bg-opacity-50 text-xl text-red-600"
                        >
                          <MdOutlineOpenInNew className="fill-white stroke-white" />
                        </button>
                      )}
                    </div>
                  );
                })
              : null}
          </div>
        </div>
        <div className="my-3 w-full">
          {values &&
            defaultSections.map(section => (
              <DiagnosisSection
                key={section.dataName}
                isEditEnabled={section.isEditable}
                sectionName={section.sectionName}
                dataName={section.dataName}
                onChangeValue={setFieldValue}
                value={values[section.dataName]}
              />
            ))}
        </div>
      </div>
      {showConfirmModal && (
        <ConfirmModal
          show={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onPressConfirm={() => createDuplicateReport(values)}
        />
      )}
    </Fragment>
  );
};

export default ViewReportTab;
