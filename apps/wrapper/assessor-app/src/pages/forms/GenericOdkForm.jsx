import React, { useState, useEffect, useContext, useRef } from "react";
import { Routes, useNavigate, useParams } from "react-router-dom";
import ROUTE_MAP from "../../routing/routeMap";

import { StateContext } from "../../App";
import { saveFormSubmission } from "../../api";
import {
  getCookie,
  getFormData,
  handleFormEvents,
  updateFormData,
  removeItemFromLocalForage,
  getSpecificDataFromForage,
} from "../../utils";

import CommonLayout from "../../components/CommonLayout";
import CommonModal from "../../components/Modal";

const ENKETO_MANAGER_URL = process.env.REACT_APP_ENKETO_MANAGER_URL;
const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;

const GenericOdkForm = (props) => {
  const user = getCookie("userData");
  let { formName, date } = useParams();
  const scheduleId = useRef();
  const [isPreview, setIsPreview] = useState(false);
  let formSpec = {
    forms: {
      [formName]: {
        skipOnSuccessMessage: true,
        prefill: {},
        submissionURL: "",
        name: formName,
        successCheck: "async (formData) => { return true; }",
        onSuccess: {
          notificationMessage: "Form submitted successfully",
          sideEffect: "async (formData) => { console.log(formData); }",
        },
        onFailure: {
          message: "Form submission failed",
          sideEffect: "async (formData) => { console.log(formData); }",
          next: {
            type: "url",
            id: "google",
          },
        },
      },
    },
    start: formName,
    date: date,
    metaData: {},
  };

  const { state } = useContext(StateContext);

  const getFormURI = (form, ofsd, prefillSpec) => {
    return encodeURIComponent(
      `${ENKETO_MANAGER_URL}/prefillXML?formUrl=${form}&onFormSuccessData=${encodeFunction(
        ofsd
      )}&prefillSpec=${encodeFunction(prefillSpec)}`
    );
  };

  const navigate = useNavigate();
  const encodeFunction = (func) => encodeURIComponent(JSON.stringify(func));
  const startingForm = formSpec.start;
  const [formId, setFormId] = useState(startingForm);
  const [encodedFormSpec, setEncodedFormSpec] = useState(
    encodeURI(JSON.stringify(formSpec.forms[formId]))
  );
  const [onFormSuccessData, setOnFormSuccessData] = useState(undefined);
  const [onFormFailureData, setOnFormFailureData] = useState(undefined);
  const [encodedFormURI, setEncodedFormURI] = useState("");
  const [prefilledFormData, setPrefilledFormData] = useState();
  const [errorModal, setErrorModal] = useState(false);

  const loading = useRef(false);
  const [assData, setData] = useState({
    district: "",
    instituteName: "",
    nursing: "",
    paramedical: "",
    type: "",
    latitude: null,
    longitude: null,
  });

  async function afterFormSubmit(e, saveFlag) {
    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;

    try {
      const { nextForm, formData, onSuccessData, onFailureData } = data;
      if (data?.state === "ON_FORM_SUCCESS_COMPLETED") {
        if (date) {
          setErrorModal(true);
          return;
        }

        const updatedFormData = await updateFormData(formSpec.start);
        const storedData = await getSpecificDataFromForage("required_data");

        const res = await saveFormSubmission({
          schedule_id: scheduleId.current,
          form_data: updatedFormData,
          assessment_type: "assessor",
          form_name: formSpec.start,
          submission_status: saveFlag === "draft" ? false : true,
          assessor_id: storedData?.assessor_user_id,
          applicant_id: storedData?.institute_id,
          submitted_on: new Date().toJSON().slice(0, 10),
          form_status: saveFlag === "draft" ? "" : "OGA Completed",
        });
        console.log(res);

        // Delete the data from the Local Forage
        const key = `${storedData?.assessor_user_id}_${formSpec.start}${
          new Date().toISOString().split("T")[0]
        }`;
        removeItemFromLocalForage(key);
        setTimeout(() => navigate(`${ROUTE_MAP.thank_you}${formName}`), 2000);
      }

      if (nextForm?.type === "form") {
        setFormId(nextForm.id);
        setOnFormSuccessData(onSuccessData);
        setOnFormFailureData(onFailureData);
        setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
        setEncodedFormURI(
          getFormURI(
            nextForm.id,
            onSuccessData,
            formSpec.forms[nextForm.id].prefill
          )
        );
        navigate(
          formName.startsWith("hospital")
            ? ROUTE_MAP.hospital_forms
            : ROUTE_MAP.medical_assessment_options
        );
      } else if (nextForm?.type === "url") {
        window.location.href = nextForm.url;
      }
    } catch (e) {
      console.log(e);
    }
  }

  const handleEventTrigger = async (e) => {
    handleFormEvents(startingForm, afterFormSubmit, e);
  };

  const bindEventListener = () => {
    window.addEventListener("message", handleEventTrigger);
  };

  const detachEventBinding = () => {
    window.removeEventListener("message", handleEventTrigger);
  };

  const checkIframeLoaded = () => {
    console.log("window.location.host - ", window.location.host);
    if (window.location.host.includes("localhost")) {
      return;
    }

    const iframeElem = document.getElementById("enketo-form");
    console.log("iframeElem - ", iframeElem);
    var iframeContent =
      iframeElem?.contentDocument || iframeElem?.contentWindow.document;
    if (date) {
      var section = iframeContent?.getElementsByClassName("or-group");
      if (!section) return;
      for (var i = 0; i < section?.length; i++) {
        var inputElements = section[i].querySelectorAll("input");
        inputElements.forEach((input) => {
          input.disabled = true;
        });
      }
      iframeElem.getElementById("submit-form").style.display = "none";
      iframeElem.getElementById("save-draft").style.display = "none";
    }

    var draftButton = iframeContent.getElementById("save-draft");
    draftButton.addEventListener("click", function () {
      alert("Hello world!");
      afterFormSubmit("", "draft");
    });
  };

  useEffect(() => {
    bindEventListener();
    getFormData({
      loading,
      scheduleId,
      formSpec,
      startingForm,
      formId,
      setData,
      setEncodedFormSpec,
      setEncodedFormURI,
    });
    setTimeout(() => {
      checkIframeLoaded();
    }, 1500);
    return () => {
      detachEventBinding();
      setData(null);
      setPrefilledFormData(null);
    };
  }, []);

  useEffect(() => {
    getFormData({
      loading,
      scheduleId,
      formSpec,
      startingForm,
      formId,
      setData,
      setEncodedFormSpec,
      setEncodedFormURI,
      isPreview,
    });
  }, [isPreview]);

  return (
    <>
      <CommonLayout
        {...props.commonLayoutProps}
        formUrl={`${ENKETO_URL}/preview?formSpec=${encodedFormSpec}&xform=${encodedFormURI}&userId=${user.user.id}`}
        formPreview={true}
        setIsPreview={setIsPreview}
      >
        {!isPreview && (
          <div className="flex flex-col items-center">
            {encodedFormURI && assData && (
              <>
                <iframe
                  title="form"
                  id="enketo-form"
                  src={`${ENKETO_URL}/preview?formSpec=${encodedFormSpec}&xform=${encodedFormURI}&userId=${user.user.id}`}
                  style={{ height: "80vh", width: "100%" }}
                />
              </>
            )}
          </div>
        )}
      </CommonLayout>
      {errorModal && (
        <CommonModal>
          <div>
            <p className="text-secondary text-2xl lg:text-3xl text-semibold font-medium text-center">
              Error!
            </p>
            <div className="flex flex-row justify-center w-full py-4 text-center">
              You can't submit a Preview form.
            </div>
            <div className="flex flex-row justify-center w-full py-4">
              <div
                className="border border-primary bg-primary text-white py-1 px-7 cursor-pointer lg:px-16 lg:py-3 lg:text-xl"
                onClick={() => setErrorModal(false)}
              >
                Close
              </div>
            </div>
          </div>
        </CommonModal>
      )}
    </>
  );
};

export default GenericOdkForm;
