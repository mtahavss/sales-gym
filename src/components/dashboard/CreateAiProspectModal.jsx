import { useEffect, useRef, useState } from "react";
import "./CreateAiProspectModal.css";
import ThemedMenuSelect from "./ThemedMenuSelect";
import ThemedMultiCombobox from "./ThemedMultiCombobox";
import ThemedSearchableSelect from "./ThemedSearchableSelect";
import {
  B2C_MONTHLY_INCOME_OPTIONS,
  B2C_OBJECTION_THEME_OPTIONS,
  B2C_OCCUPATION_OPTIONS,
} from "../../lib/b2cProspectOptions";
import { PROSPECT_INDUSTRY_FORM_OPTIONS } from "../../lib/prospectIndustryOptions";

const CAP_DRAFT_KEY = "salesgym:create-ai-prospect-draft";
const CAP_DRAFT_VERSION = 2;

const AGES = Array.from({ length: 82 }, (_, i) => String(18 + i));

/** @returns {Record<string, unknown>} */
function getDefaultDraftForm() {
  return {
    step: 1,
    prospectType: "b2b",
    fullName: "",
    age: "",
    description: "",
    job: "",
    industry: "",
    companySize: "",
    showCustomJob: false,
    customPosition: "",
    productDetails: "",
    trainingSelected: [],
    customTrainingItems: [],
    challengeSelected: [],
    customChallengeItems: [],
    conversationSelected: [],
    customConversationItems: [],
    showConversationCustom: false,
    conversationCustomDraft: "",
    voiceLangFilter: "English",
    voiceKindFilter: "all",
    voiceAgeFilter: "all",
    voiceSearch: "",
    selectedVoiceId: "",
    b2cOccupation: "",
    b2cUseCustomOccupation: false,
    b2cCustomOccupation: "",
    b2cMonthlyIncome: "",
    b2cObjectionSelected: [],
    b2cObjectionCustom: [],
  };
}

function clampDraftStep(step) {
  return typeof step === "number" && step >= 1 ? Math.min(step, 5) : 1;
}

function loadDraftForm() {
  const defaults = getDefaultDraftForm();
  try {
    const raw = sessionStorage.getItem(CAP_DRAFT_KEY);
    if (!raw) return defaults;
    const d = JSON.parse(raw);
    if (d?.v !== CAP_DRAFT_VERSION) return defaults;
    const { v: _draftVer, ...rest } = d;
    const merged = { ...defaults, ...rest };
    merged.trainingSelected = Array.isArray(d.trainingSelected) ? d.trainingSelected : [];
    merged.customTrainingItems = Array.isArray(d.customTrainingItems) ? d.customTrainingItems : [];
    merged.challengeSelected = Array.isArray(d.challengeSelected) ? d.challengeSelected : [];
    merged.customChallengeItems = Array.isArray(d.customChallengeItems) ? d.customChallengeItems : [];
    merged.conversationSelected = Array.isArray(d.conversationSelected) ? d.conversationSelected : [];
    merged.customConversationItems = Array.isArray(d.customConversationItems) ? d.customConversationItems : [];
    merged.b2cObjectionSelected = Array.isArray(d.b2cObjectionSelected) ? d.b2cObjectionSelected : [];
    merged.b2cObjectionCustom = Array.isArray(d.b2cObjectionCustom) ? d.b2cObjectionCustom : [];
    merged.b2cOccupation = typeof d.b2cOccupation === "string" ? d.b2cOccupation : "";
    merged.b2cUseCustomOccupation = Boolean(d.b2cUseCustomOccupation);
    merged.b2cCustomOccupation = typeof d.b2cCustomOccupation === "string" ? d.b2cCustomOccupation : "";
    merged.b2cMonthlyIncome = typeof d.b2cMonthlyIncome === "string" ? d.b2cMonthlyIncome : "";
    merged.prospectType = d.prospectType === "b2c" ? "b2c" : "b2b";
    merged.step = clampDraftStep(d.step);
    return merged;
  } catch {
    return defaults;
  }
}

function persistDraftForm(payload) {
  try {
    sessionStorage.setItem(CAP_DRAFT_KEY, JSON.stringify({ v: CAP_DRAFT_VERSION, ...payload }));
  } catch {
    /* ignore quota / private mode */
  }
}

function clearDraftForm() {
  try {
    sessionStorage.removeItem(CAP_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

const JOB_OPTIONS = [
  { value: "", label: "Select position" },
  { value: "sales-manager", label: "Sales Manager" },
  { value: "account-executive", label: "Account Executive" },
  { value: "vp-sales", label: "VP of Sales" },
  { value: "ceo", label: "CEO" },
  { value: "cfo", label: "CFO" },
  { value: "cto", label: "CTO" },
  { value: "director-ops", label: "Director of Operations" },
  { value: "procurement", label: "Head of Procurement" },
];

const INDUSTRY_OPTIONS = PROSPECT_INDUSTRY_FORM_OPTIONS;

const COMPANY_SIZE_OPTIONS = [
  { value: "", label: "Select company size" },
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-1000", label: "201–1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

const TRAINING_GOAL_OPTIONS = [
  { value: "discovery", label: "Discovery & qualification" },
  { value: "objections", label: "Objection handling" },
  { value: "closing", label: "Closing & commitment" },
  { value: "rapport", label: "Rapport & trust" },
  { value: "presentation", label: "Presentation & demo" },
];

const CHALLENGE_OPTIONS = [
  { value: "price", label: "Price & budget pushback" },
  { value: "timing", label: "Timing — not ready to decide" },
  { value: "competitor", label: "Competitor / status quo" },
  { value: "authority", label: "Missing decision authority" },
  { value: "trust", label: "Trust & skepticism" },
];

const CONVERSATION_TYPE_OPTIONS = [
  { value: "discovery-call", label: "Discovery call" },
  { value: "closing-call", label: "Closing call" },
  { value: "product-demo", label: "Product demo" },
  { value: "cold-call", label: "Cold call" },
  { value: "follow-up", label: "Follow up call" },
];

/** Final step (B2B & B2C): voice picker + review (100% progress on step 5). */
const VOICE_LANG_FILTER_OPTIONS = [
  { value: "all", label: "All languages" },
  { value: "English", label: "English" },
];

const VOICE_KIND_FILTER_OPTIONS = [
  { value: "all", label: "All Voices" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const VOICE_AGE_FILTER_OPTIONS = [
  { value: "all", label: "All Ages" },
  { value: "young", label: "Young adult" },
  { value: "adult", label: "Adult" },
];

const B2B_VOICE_OPTIONS = [
  {
    id: "carson",
    name: "Carson",
    gender: "Male",
    lang: "English",
    age: "young",
    blurb: "Friendly young adult male for customer support conversations",
  },
  {
    id: "blake",
    name: "Blake",
    gender: "Male",
    lang: "English",
    age: "adult",
    blurb: "Energetic adult male for engaging customer support",
  },
  {
    id: "jameson",
    name: "Jameson",
    gender: "Male",
    lang: "English",
    age: "adult",
    blurb: "Friendly, laid-back male voice for customer support and onboarding",
  },
  {
    id: "cole",
    name: "Cole",
    gender: "Male",
    lang: "English",
    age: "adult",
    blurb: "Articulate, approachable male designed for friendly communication",
  },
  {
    id: "keith",
    name: "Keith",
    gender: "Male",
    lang: "English",
    age: "adult",
    blurb: "Clear, confident male voice suited for B2B sales conversations",
  },
  {
    id: "maya",
    name: "Maya",
    gender: "Female",
    lang: "English",
    age: "adult",
    blurb: "Warm professional female voice for discovery and follow-up calls",
  },
];

function splitStoredList(str) {
  return String(str || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Map stored `form_data` from the DB into Create modal state (merge over getDefaultDraftForm).
 * @param {Record<string, unknown>} raw
 */
function modalInitFromSavedFormData(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  const prospectType = data.prospectType === "b2c" ? "b2c" : "b2b";

  function partitionOptionLabels(semicolonStr, options) {
    const selected = [];
    const custom = [];
    for (const label of splitStoredList(semicolonStr)) {
      const opt = options.find((o) => o.value && (o.label === label || o.value === label));
      if (opt) selected.push(opt.value);
      else custom.push(label);
    }
    return { selected, custom };
  }

  const jobLabel = typeof data.job === "string" ? data.job.trim() : "";
  let showCustomJob = false;
  let job = "";
  let customPosition = "";
  if (prospectType === "b2b" && jobLabel) {
    const jobOpt = JOB_OPTIONS.find((o) => o.value && o.label === jobLabel);
    if (jobOpt) {
      job = jobOpt.value;
    } else {
      showCustomJob = true;
      customPosition = jobLabel;
    }
  }

  const industryLabel = typeof data.industry === "string" ? data.industry.trim() : "";
  const industryOpt = INDUSTRY_OPTIONS.find((o) => o.value && o.label === industryLabel);
  const industry = industryOpt?.value || "";

  const companyLabel =
    typeof data.companySize === "string" ? data.companySize.trim() : "";
  const sizeOpt = COMPANY_SIZE_OPTIONS.find((o) => o.value && o.label === companyLabel);
  const companySize = prospectType === "b2b" ? sizeOpt?.value || "" : "";

  const { selected: trainingSelected, custom: customTrainingItems } = partitionOptionLabels(
    data.trainingGoals,
    TRAINING_GOAL_OPTIONS,
  );
  const { selected: challengeSelected, custom: customChallengeItems } = partitionOptionLabels(
    data.expectedChallenges,
    CHALLENGE_OPTIONS,
  );
  const { selected: conversationSelected, custom: customConversationItems } = partitionOptionLabels(
    data.conversationTypes,
    CONVERSATION_TYPE_OPTIONS,
  );

  const voiceName = typeof data.voice === "string" ? data.voice.trim() : "";
  let selectedVoiceId = B2B_VOICE_OPTIONS.find((v) => v.name === voiceName)?.id || "";
  if (!selectedVoiceId && B2B_VOICE_OPTIONS[0]) {
    selectedVoiceId = B2B_VOICE_OPTIONS[0].id;
  }

  const b2cIncomeLabel =
    (typeof data.b2cMonthlyIncome === "string" ? data.b2cMonthlyIncome.trim() : "") ||
    (prospectType === "b2c" && typeof data.companySize === "string" ? data.companySize.trim() : "");
  const incOpt = B2C_MONTHLY_INCOME_OPTIONS.find((o) => o.value && o.label === b2cIncomeLabel);
  const b2cMonthlyIncome = incOpt?.value || "";

  const { selected: b2cObjectionSelected, custom: b2cObjectionCustom } = partitionOptionLabels(
    data.b2cObjectionThemes,
    B2C_OBJECTION_THEME_OPTIONS,
  );

  let b2cOccupation = "";
  let b2cUseCustomOccupation = false;
  let b2cCustomOccupation = "";
  if (prospectType === "b2c" && jobLabel) {
    const occOpt = B2C_OCCUPATION_OPTIONS.find((o) => o.value && o.label === jobLabel);
    if (occOpt) {
      b2cOccupation = occOpt.value;
    } else {
      b2cUseCustomOccupation = true;
      b2cCustomOccupation = jobLabel;
    }
  }

  const ageStr =
    typeof data.age === "string" ? data.age : data.age != null ? String(data.age) : "";

  return {
    step: 1,
    prospectType,
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    age: ageStr,
    description: typeof data.description === "string" ? data.description : "",
    job,
    industry,
    companySize,
    showCustomJob,
    customPosition,
    productDetails: typeof data.productDetails === "string" ? data.productDetails : "",
    trainingSelected,
    customTrainingItems,
    challengeSelected,
    customChallengeItems,
    conversationSelected,
    customConversationItems,
    showConversationCustom: customConversationItems.length > 0,
    conversationCustomDraft: "",
    selectedVoiceId,
    voiceLangFilter: "English",
    voiceKindFilter: "all",
    voiceAgeFilter: "all",
    voiceSearch: "",
    b2cOccupation,
    b2cUseCustomOccupation,
    b2cCustomOccupation,
    b2cMonthlyIncome,
    b2cObjectionSelected,
    b2cObjectionCustom,
  };
}

function SpeakerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a9 9 0 0 1 0 14.14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function InfoIcon({ title = "Helps the AI shape tone and talking points." }) {
  return (
    <span className="cap-field-hint" title={title}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </span>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * @param {{
 *   onClose: () => void;
 *   onContinue?: (data: Record<string, string>) => void | Promise<void>;
 *   editRecord?: { id: string; form_data?: Record<string, unknown> } | null;
 * }} props
 */
export default function CreateAiProspectModal({ onClose, onContinue, editRecord = null }) {
  const initialFormRef = useRef(null);
  if (initialFormRef.current === null) {
    initialFormRef.current =
      editRecord?.form_data && typeof editRecord.form_data === "object"
        ? { ...getDefaultDraftForm(), ...modalInitFromSavedFormData(editRecord.form_data) }
        : loadDraftForm();
  }
  const init = initialFormRef.current;

  const [step, setStep] = useState(init.step);
  const [prospectType, setProspectType] = useState(init.prospectType);
  const [fullName, setFullName] = useState(init.fullName);
  const [age, setAge] = useState(init.age);
  const [description, setDescription] = useState(init.description);
  const [job, setJob] = useState(init.job);
  const [industry, setIndustry] = useState(init.industry);
  const [companySize, setCompanySize] = useState(init.companySize);
  const [showCustomJob, setShowCustomJob] = useState(init.showCustomJob);
  const [customPosition, setCustomPosition] = useState(init.customPosition);

  const [productDetails, setProductDetails] = useState(init.productDetails);
  const [trainingSelected, setTrainingSelected] = useState(init.trainingSelected);
  const [customTrainingItems, setCustomTrainingItems] = useState(init.customTrainingItems);
  const [challengeSelected, setChallengeSelected] = useState(init.challengeSelected);
  const [customChallengeItems, setCustomChallengeItems] = useState(init.customChallengeItems);

  const [conversationSelected, setConversationSelected] = useState(init.conversationSelected);
  const [customConversationItems, setCustomConversationItems] = useState(init.customConversationItems);
  const [showConversationCustom, setShowConversationCustom] = useState(init.showConversationCustom);
  const [conversationCustomDraft, setConversationCustomDraft] = useState(init.conversationCustomDraft);

  const [voiceLangFilter, setVoiceLangFilter] = useState(init.voiceLangFilter);
  const [voiceKindFilter, setVoiceKindFilter] = useState(init.voiceKindFilter);
  const [voiceAgeFilter, setVoiceAgeFilter] = useState(init.voiceAgeFilter);
  const [voiceSearch, setVoiceSearch] = useState(init.voiceSearch);
  const [selectedVoiceId, setSelectedVoiceId] = useState(init.selectedVoiceId);

  const [b2cOccupation, setB2cOccupation] = useState(init.b2cOccupation);
  const [b2cUseCustomOccupation, setB2cUseCustomOccupation] = useState(init.b2cUseCustomOccupation);
  const [b2cCustomOccupation, setB2cCustomOccupation] = useState(init.b2cCustomOccupation);
  const [b2cMonthlyIncome, setB2cMonthlyIncome] = useState(init.b2cMonthlyIncome);
  const [b2cObjectionSelected, setB2cObjectionSelected] = useState(init.b2cObjectionSelected);
  const [b2cObjectionCustom, setB2cObjectionCustom] = useState(init.b2cObjectionCustom);

  const [ageMenuOpen, setAgeMenuOpen] = useState(false);
  const ageWrapRef = useRef(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (editRecord) return;
    persistDraftForm({
      step,
      prospectType,
      fullName,
      age,
      description,
      job,
      industry,
      companySize,
      showCustomJob,
      customPosition,
      productDetails,
      trainingSelected,
      customTrainingItems,
      challengeSelected,
      customChallengeItems,
      conversationSelected,
      customConversationItems,
      showConversationCustom,
      conversationCustomDraft,
      voiceLangFilter,
      voiceKindFilter,
      voiceAgeFilter,
      voiceSearch,
      selectedVoiceId,
      b2cOccupation,
      b2cUseCustomOccupation,
      b2cCustomOccupation,
      b2cMonthlyIncome,
      b2cObjectionSelected,
      b2cObjectionCustom,
    });
  }, [
    editRecord,
    step,
    prospectType,
    fullName,
    age,
    description,
    job,
    industry,
    companySize,
    showCustomJob,
    customPosition,
    productDetails,
    trainingSelected,
    customTrainingItems,
    challengeSelected,
    customChallengeItems,
    conversationSelected,
    customConversationItems,
    showConversationCustom,
    conversationCustomDraft,
    voiceLangFilter,
    voiceKindFilter,
    voiceAgeFilter,
    voiceSearch,
    selectedVoiceId,
    b2cOccupation,
    b2cUseCustomOccupation,
    b2cCustomOccupation,
    b2cMonthlyIncome,
    b2cObjectionSelected,
    b2cObjectionCustom,
  ]);

  const step1Complete =
    Boolean(fullName.trim()) && Boolean(age) && Boolean(description.trim());

  const jobOk = showCustomJob ? Boolean(customPosition.trim()) : Boolean(job);
  const b2cOccupationOk = b2cUseCustomOccupation
    ? Boolean(b2cCustomOccupation.trim())
    : Boolean(b2cOccupation);
  const b2cObjectionsChosen =
    b2cObjectionSelected.length > 0 || b2cObjectionCustom.length > 0;
  const step2Complete =
    prospectType === "b2b"
      ? jobOk && Boolean(industry) && Boolean(companySize)
      : b2cOccupationOk && Boolean(b2cMonthlyIncome) && b2cObjectionsChosen;

  const challengesChosen =
    challengeSelected.length > 0 || customChallengeItems.length > 0;
  const step3Complete = Boolean(productDetails.trim()) && challengesChosen;

  const conversationChosen =
    conversationSelected.length > 0 || customConversationItems.length > 0;
  const step4Complete = conversationChosen;

  const step5Complete = Boolean(selectedVoiceId);

  /** 20% per step; both flows use 5 steps → 20,40,60,80,100. */
  const progressPercent = step * 20;

  const voiceQuery = voiceSearch.trim().toLowerCase();
  const filteredVoices = B2B_VOICE_OPTIONS.filter((v) => {
    if (voiceLangFilter !== "all" && v.lang !== voiceLangFilter) return false;
    if (voiceKindFilter !== "all" && v.gender !== voiceKindFilter) return false;
    if (voiceAgeFilter !== "all" && v.age !== voiceAgeFilter) return false;
    if (!voiceQuery) return true;
    return (
      v.name.toLowerCase().includes(voiceQuery) ||
      v.blurb.toLowerCase().includes(voiceQuery) ||
      v.gender.toLowerCase().includes(voiceQuery)
    );
  });

  const summaryJobLabel =
    showCustomJob ? customPosition.trim() : JOB_OPTIONS.find((o) => o.value === job)?.label || job;
  const summaryIndustryLabel = INDUSTRY_OPTIONS.find((o) => o.value === industry)?.label || industry;
  const summaryCompanySizeLabel =
    COMPANY_SIZE_OPTIONS.find((o) => o.value === companySize)?.label || companySize;
  const summaryTrainingText = [
    ...trainingSelected.map((v) => TRAINING_GOAL_OPTIONS.find((o) => o.value === v)?.label || v),
    ...customTrainingItems,
  ].join("; ");
  const summaryChallengeText = [
    ...challengeSelected.map((v) => CHALLENGE_OPTIONS.find((o) => o.value === v)?.label || v),
    ...customChallengeItems,
  ].join("; ");
  const summaryConversationText = [
    ...conversationSelected.map((v) => CONVERSATION_TYPE_OPTIONS.find((o) => o.value === v)?.label || v),
    ...customConversationItems,
  ].join("; ");
  const summaryVoiceName = B2B_VOICE_OPTIONS.find((v) => v.id === selectedVoiceId)?.name || "—";
  const summaryB2cOccupation = b2cUseCustomOccupation
    ? b2cCustomOccupation.trim()
    : B2C_OCCUPATION_OPTIONS.find((o) => o.value === b2cOccupation)?.label || "";
  const summaryB2cIncome =
    B2C_MONTHLY_INCOME_OPTIONS.find((o) => o.value === b2cMonthlyIncome)?.label || "";
  const summaryB2cObjectionThemes = [
    ...b2cObjectionSelected.map(
      (v) => B2C_OBJECTION_THEME_OPTIONS.find((o) => o.value === v)?.label || v,
    ),
    ...b2cObjectionCustom,
  ].join("; ");

  useEffect(() => {
    if (!ageMenuOpen || !age) return;
    const el = document.getElementById(`cap-age-opt-${age}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [ageMenuOpen, age]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (ageMenuOpen) {
        setAgeMenuOpen(false);
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, ageMenuOpen]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!ageMenuOpen) return;
      if (ageWrapRef.current && !ageWrapRef.current.contains(e.target)) {
        setAgeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [ageMenuOpen]);

  function handleOverlayMouseDown(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function goStep2() {
    if (!step1Complete) return;
    setStep(2);
  }

  function goStep3() {
    if (!step2Complete) return;
    setStep(3);
  }

  function goStep4() {
    if (!step3Complete) return;
    setStep(4);
  }

  function advanceFromStep4() {
    if (!step4Complete) return;
    setStep(5);
  }

  function handleFinishProspect() {
    if (!step5Complete) return;
    finishAndClose();
  }

  async function finishAndClose() {
    const jobLabel =
      prospectType === "b2c"
        ? b2cUseCustomOccupation
          ? b2cCustomOccupation.trim()
          : B2C_OCCUPATION_OPTIONS.find((o) => o.value === b2cOccupation)?.label || b2cOccupation
        : showCustomJob
          ? customPosition.trim()
          : JOB_OPTIONS.find((o) => o.value === job)?.label || job;

    const b2cIncomeLabel =
      prospectType === "b2c"
        ? B2C_MONTHLY_INCOME_OPTIONS.find((o) => o.value === b2cMonthlyIncome)?.label || ""
        : "";

    const b2cObjectionThemeLabels = [
      ...b2cObjectionSelected.map(
        (v) => B2C_OBJECTION_THEME_OPTIONS.find((o) => o.value === v)?.label || v,
      ),
      ...b2cObjectionCustom,
    ].join("; ");
    const trainingLabels = [
      ...trainingSelected.map(
        (v) => TRAINING_GOAL_OPTIONS.find((o) => o.value === v)?.label || v,
      ),
      ...customTrainingItems,
    ];
    const challengeLabels = [
      ...challengeSelected.map((v) => CHALLENGE_OPTIONS.find((o) => o.value === v)?.label || v),
      ...customChallengeItems,
    ];
    const conversationLabels = [
      ...conversationSelected.map(
        (v) => CONVERSATION_TYPE_OPTIONS.find((o) => o.value === v)?.label || v,
      ),
      ...customConversationItems,
    ];
    const voiceName = B2B_VOICE_OPTIONS.find((v) => v.id === selectedVoiceId)?.name || "";

    const payload = {
      prospectType,
      fullName: fullName.trim(),
      age,
      description: description.trim(),
      job: jobLabel,
      industry:
        prospectType === "b2c"
          ? ""
          : INDUSTRY_OPTIONS.find((o) => o.value === industry)?.label || industry,
      companySize:
        prospectType === "b2c"
          ? b2cIncomeLabel
          : COMPANY_SIZE_OPTIONS.find((o) => o.value === companySize)?.label || companySize,
      productDetails: productDetails.trim(),
      trainingGoals: trainingLabels.join("; "),
      expectedChallenges: challengeLabels.join("; "),
      conversationTypes: conversationLabels.join("; "),
      ...(voiceName ? { voice: voiceName } : {}),
      ...(prospectType === "b2c"
        ? {
            b2cMonthlyIncome: b2cIncomeLabel,
            b2cObjectionThemes: b2cObjectionThemeLabels,
          }
        : {}),
    };

    setCreateError("");
    setCreating(true);
    try {
      if (onContinue) {
        const result = onContinue(payload);
        if (result != null && typeof result.then === "function") {
          await result;
        }
      }
      if (!editRecord) clearDraftForm();
      onClose();
    } catch (err) {
      setCreateError(err?.message || "Could not save prospect.");
    } finally {
      setCreating(false);
    }
  }

  function handleCancelNew() {
    if (!editRecord) clearDraftForm();
    onClose();
  }

  function addConversationCustomItem() {
    const t = conversationCustomDraft.trim();
    if (!t) return;
    setCustomConversationItems((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setConversationCustomDraft("");
  }

  function toggleCustomJob() {
    setShowCustomJob((v) => {
      if (v) {
        setCustomPosition("");
      } else {
        setJob("");
      }
      return !v;
    });
  }

  function toggleB2cCustomOccupation() {
    setB2cUseCustomOccupation((v) => {
      if (v) {
        setB2cCustomOccupation("");
      } else {
        setB2cOccupation("");
      }
      return !v;
    });
  }

  function openMcomboIfClosed(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (el.getAttribute("aria-expanded") === "true") return;
    el.click();
  }

  return (
    <div className="cap-overlay" onMouseDown={handleOverlayMouseDown} role="presentation">
      <div
        className={`cap-modal${step >= 2 ? " cap-modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cap-dialog-title"
        aria-describedby="cap-dialog-desc"
      >
        <div className="cap-header">
          <div>
            <h2 id="cap-dialog-title" className="cap-title">
              {editRecord ? "Edit AI Prospect" : "Create AI Prospect"}
            </h2>
            <p id="cap-dialog-desc" className="cap-subtitle">
              {editRecord
                ? "Update this prospect's details; changes are saved to your account."
                : "Define the persona, context, and objections so you can launch a realistic practice call in minutes."}
            </p>
          </div>
          <button type="button" className="cap-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="cap-body">
          <div className="cap-progress" aria-hidden={false}>
            <div className="cap-progress-row">
              <span className="cap-progress-label">Progress</span>
              <span className="cap-progress-pct">{progressPercent}%</span>
            </div>
            <div className="cap-progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="cap-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {step === 1 && (
            <>
              <h3 className="cap-step-heading">General Information</h3>
              <p className="cap-step-lead">Select prospect type and define their basic identity.</p>

              <p className="cap-section-label cap-section-label--spaced">Prospect type</p>
              <div className="cap-type-row" role="group" aria-label="Prospect type">
                <button
                  type="button"
                  className={`cap-type-card${prospectType === "b2b" ? " is-selected" : ""}`}
                  onClick={() => setProspectType("b2b")}
                  aria-pressed={prospectType === "b2b"}
                >
                  <span className="cap-type-name">Business (B2B)</span>
                  <span className="cap-type-desc">Business clients with company roles.</span>
                </button>
                <button
                  type="button"
                  className={`cap-type-card${prospectType === "b2c" ? " is-selected" : ""}`}
                  onClick={() => setProspectType("b2c")}
                  aria-pressed={prospectType === "b2c"}
                >
                  <span className="cap-type-name">Consumer (B2C)</span>
                  <span className="cap-type-desc">Individual consumers for personal sales.</span>
                </button>
              </div>

              <div className="cap-field">
                <label className="cap-label" htmlFor="cap-full-name">
                  Full Name
                  <InfoIcon />
                </label>
                <input
                  id="cap-full-name"
                  type="text"
                  className="cap-input"
                  placeholder="e.g., Sarah Johnson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="cap-field">
                <span className="cap-label" id="cap-age-label">
                  Age
                  <InfoIcon />
                </span>
                <div className="cap-age-wrap" ref={ageWrapRef}>
                  <button
                    type="button"
                    id="cap-age"
                    className="cap-age-trigger"
                    aria-labelledby="cap-age-label"
                    aria-haspopup="listbox"
                    aria-expanded={ageMenuOpen}
                    onClick={() => setAgeMenuOpen((o) => !o)}
                  >
                    <span className={age ? "" : "cap-age-trigger-placeholder"}>
                      {age || "Select age"}
                    </span>
                    <ChevronDownIcon />
                  </button>
                  {ageMenuOpen ? (
                    <ul className="cap-age-popover" role="listbox" aria-label="Age">
                      {AGES.map((n) => {
                        const selected = age === n;
                        return (
                          <li key={n} role="presentation">
                            <button
                              type="button"
                              id={`cap-age-opt-${n}`}
                              role="option"
                              aria-selected={selected}
                              className={`cap-age-option${selected ? " is-selected" : ""}`}
                              onClick={() => {
                                setAge(n);
                                setAgeMenuOpen(false);
                              }}
                            >
                              <span className="cap-age-check" aria-hidden="true">
                                {selected ? "✓" : ""}
                              </span>
                              <span className="cap-age-num">{n}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="cap-field cap-field--last">
                <label className="cap-label" htmlFor="cap-description">
                  Description
                  <InfoIcon />
                </label>
                <textarea
                  id="cap-description"
                  className="cap-textarea"
                  rows={4}
                  placeholder="e.g., Analytical decision-maker who values data-driven solutions. Direct communicator with limited time for lengthy presentations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && prospectType === "b2b" && (
            <>
              <h3 className="cap-step-heading">Professional Profile</h3>
              <p className="cap-step-lead">
                Define the business context and professional background of your prospect.
              </p>

              <div className="cap-pro-grid">
                <div className="cap-field cap-field--grid">
                  <label className="cap-label" htmlFor="cap-job">
                    Job
                    <InfoIcon title="Main role or title for this prospect." />
                  </label>
                  {showCustomJob ? (
                    <input
                      id="cap-job"
                      type="text"
                      className="cap-input"
                      placeholder="Enter custom position"
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                    />
                  ) : (
                    <ThemedMenuSelect
                      buttonId="cap-job"
                      className="cap-field-select"
                      value={job}
                      onChange={setJob}
                      options={JOB_OPTIONS}
                    />
                  )}
                  <button type="button" className="cap-add-custom-btn" onClick={toggleCustomJob}>
                    {showCustomJob ? "← Choose from list" : "+ Add custom position"}
                  </button>
                  <p className="cap-field-hint-text">Select job title – Choose main position</p>
                </div>

                <div className="cap-field cap-field--grid">
                  <label className="cap-label" htmlFor="cap-industry">
                    Industry Sector
                    <InfoIcon title="Primary industry for this prospect." />
                  </label>
                  <ThemedMenuSelect
                    buttonId="cap-industry"
                    className="cap-field-select"
                    value={industry}
                    onChange={setIndustry}
                    options={INDUSTRY_OPTIONS}
                  />
                </div>
              </div>

              <div className="cap-field cap-field--last">
                <label className="cap-label" htmlFor="cap-company-size">
                  Company Size
                  <InfoIcon title="Approximate headcount for their organization." />
                </label>
                <ThemedMenuSelect
                  buttonId="cap-company-size"
                  className="cap-field-select"
                  value={companySize}
                  onChange={setCompanySize}
                  options={COMPANY_SIZE_OPTIONS}
                />
              </div>
            </>
          )}

          {step === 2 && prospectType === "b2c" && (
            <>
              <h3 className="cap-step-heading">Personal Profile</h3>
              <p className="cap-step-lead">
                Establish the personal circumstances and characteristics of your consumer prospect.
              </p>

              <div className="cap-field">
                <div className="cap-label" id="cap-b2c-occupation-label">
                  Occupation
                  <InfoIcon title="Main occupation or role for this consumer prospect." />
                </div>
                {b2cUseCustomOccupation ? (
                  <input
                    id="cap-b2c-occupation-custom"
                    type="text"
                    className="cap-input"
                    placeholder="Enter custom occupation"
                    value={b2cCustomOccupation}
                    onChange={(e) => setB2cCustomOccupation(e.target.value)}
                    aria-labelledby="cap-b2c-occupation-label"
                  />
                ) : (
                  <ThemedSearchableSelect
                    buttonId="cap-b2c-occupation"
                    className="cap-field-select"
                    value={b2cOccupation}
                    onChange={setB2cOccupation}
                    options={B2C_OCCUPATION_OPTIONS}
                    searchPlaceholder="Search…"
                    labelledBy="cap-b2c-occupation-label"
                    showCloseFooter
                  />
                )}
                <button type="button" className="cap-add-custom-btn" onClick={toggleB2cCustomOccupation}>
                  {b2cUseCustomOccupation ? "← Choose from list" : "+ Add custom occupation"}
                </button>
                <p className="cap-field-hint-text">
                  <strong>Select occupation</strong> — Choose main occupation
                </p>
              </div>

              <div className="cap-field">
                <label className="cap-label" htmlFor="cap-b2c-income">
                  Monthly Income
                  <InfoIcon title="Approximate monthly household or personal income range." />
                </label>
                <ThemedMenuSelect
                  buttonId="cap-b2c-income"
                  className="cap-field-select"
                  value={b2cMonthlyIncome}
                  onChange={setB2cMonthlyIncome}
                  options={B2C_MONTHLY_INCOME_OPTIONS}
                />
              </div>

              <div className="cap-field cap-field--last">
                <div className="cap-label" id="cap-b2c-objection-label">
                  Objection Themes
                  <InfoIcon title="Typical objections this consumer might raise during the conversation." />
                </div>
                <ThemedMultiCombobox
                  className="cap-field-mcombo"
                  options={B2C_OBJECTION_THEME_OPTIONS}
                  selected={b2cObjectionSelected}
                  onSelectedChange={setB2cObjectionSelected}
                  customItems={b2cObjectionCustom}
                  onCustomItemsChange={setB2cObjectionCustom}
                  placeholder="Select objection themes"
                  searchPlaceholder="Search…"
                  addCustomPlaceholder="Add custom objections…"
                  labelledBy="cap-b2c-objection-label"
                  comboboxId="cap-b2c-objection-mcombo"
                  showClearAll={false}
                />
                <p className="cap-field-hint-text">
                  <strong>Select objection themes</strong> — Choose typical objections they might say
                </p>
              </div>
            </>
          )}

          {step === 3 && prospectType === "b2b" && (
            <>
              <h3 className="cap-step-heading">Sales Offering</h3>
              <p className="cap-step-lead">
                Define your product or service and establish clear training objectives for the sales simulation.
              </p>

              <div className="cap-field">
                <label className="cap-label" htmlFor="cap-product-details">
                  Product or Service Details
                  <InfoIcon title="What you sell — features, pricing, and value proposition help the AI simulate realistic buyer reactions." />
                </label>
                <textarea
                  id="cap-product-details"
                  className="cap-textarea cap-textarea--offering"
                  rows={5}
                  placeholder="Example: Enterprise CRM software priced at $299/month per user, featuring advanced analytics, automated workflows, and 24/7 support to help businesses increase sales efficiency by 40%."
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                />
              </div>

              <div className="cap-field">
                <div className="cap-label" id="cap-training-multi-label">
                  Training Objectives
                  <InfoIcon title="Open the list to search, select multiple goals, or add custom entries." />
                </div>
                <ThemedMultiCombobox
                  className="cap-field-mcombo"
                  options={TRAINING_GOAL_OPTIONS}
                  selected={trainingSelected}
                  onSelectedChange={setTrainingSelected}
                  customItems={customTrainingItems}
                  onCustomItemsChange={setCustomTrainingItems}
                  placeholder="Select training goals (optional)"
                  searchPlaceholder="Search…"
                  addCustomPlaceholder="Add custom training goal…"
                  labelledBy="cap-training-multi-label"
                  comboboxId="cap-training-mcombo"
                />
                <p className="cap-field-hint-text">
                  <strong>Optional</strong> — Use the dropdown to search, multi-select, or add custom goals
                </p>
              </div>

              <div className="cap-field cap-field--last">
                <div className="cap-label" id="cap-challenge-multi-label">
                  Expected Challenges
                  <InfoIcon title="Open the list to search, select multiple challenges, or add custom entries." />
                </div>
                <ThemedMultiCombobox
                  className="cap-field-mcombo"
                  options={CHALLENGE_OPTIONS}
                  selected={challengeSelected}
                  onSelectedChange={setChallengeSelected}
                  customItems={customChallengeItems}
                  onCustomItemsChange={setCustomChallengeItems}
                  placeholder="Select expected challenges"
                  searchPlaceholder="Search…"
                  addCustomPlaceholder="Add custom challenge…"
                  labelledBy="cap-challenge-multi-label"
                  comboboxId="cap-challenge-mcombo"
                />
                <p className="cap-field-hint-text">
                  <strong>Select at least one</strong> — From the list and/or custom in the dropdown
                </p>
              </div>
            </>
          )}

          {step === 3 && prospectType === "b2c" && (
            <>
              <h3 className="cap-step-heading">Sales Offering</h3>
              <p className="cap-step-lead">
                Define your product or service and establish clear training objectives for the sales simulation.
              </p>

              <div className="cap-field">
                <label className="cap-label" htmlFor="cap-b2c-product-details">
                  Product or Service Details
                  <InfoIcon title="What you sell to consumers — features, pricing, and value help the AI simulate realistic reactions." />
                </label>
                <textarea
                  id="cap-b2c-product-details"
                  className="cap-textarea cap-textarea--offering"
                  rows={5}
                  placeholder="Example: Meal-kit subscription at $79/month with flexible recipes, skip any week, and doorstep delivery for busy households."
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                />
              </div>

              <div className="cap-field">
                <div className="cap-label" id="cap-b2c-training-multi-label">
                  Training Objectives
                  <InfoIcon title="Optional — choose what you want to practice; search, multi-select, or add custom goals." />
                </div>
                <ThemedMultiCombobox
                  className="cap-field-mcombo"
                  options={TRAINING_GOAL_OPTIONS}
                  selected={trainingSelected}
                  onSelectedChange={setTrainingSelected}
                  customItems={customTrainingItems}
                  onCustomItemsChange={setCustomTrainingItems}
                  placeholder="Select training goals (optional)"
                  searchPlaceholder="Search…"
                  addCustomPlaceholder="Add custom training goal…"
                  labelledBy="cap-b2c-training-multi-label"
                  comboboxId="cap-b2c-training-mcombo"
                />
                <button
                  type="button"
                  className="cap-add-custom-btn"
                  onClick={() => openMcomboIfClosed("cap-b2c-training-mcombo")}
                >
                  + Add custom training goal
                </button>
                <p className="cap-field-hint-text">
                  <strong>Optional</strong> — Choose what you want to practice
                </p>
              </div>

              <div className="cap-field cap-field--last">
                <div className="cap-label" id="cap-b2c-challenge-multi-label">
                  Expected Challenges
                  <InfoIcon title="Likely obstacles during the conversation — select from the list and/or add custom challenges." />
                </div>
                <ThemedMultiCombobox
                  className="cap-field-mcombo"
                  options={CHALLENGE_OPTIONS}
                  selected={challengeSelected}
                  onSelectedChange={setChallengeSelected}
                  customItems={customChallengeItems}
                  onCustomItemsChange={setCustomChallengeItems}
                  placeholder="Select expected challenges"
                  searchPlaceholder="Search…"
                  addCustomPlaceholder="Add custom challenge…"
                  labelledBy="cap-b2c-challenge-multi-label"
                  comboboxId="cap-b2c-challenge-mcombo"
                />
                <button
                  type="button"
                  className="cap-add-custom-btn"
                  onClick={() => openMcomboIfClosed("cap-b2c-challenge-mcombo")}
                >
                  + Add custom challenge
                </button>
                <p className="cap-field-hint-text">
                  <strong>Select challenges</strong> — Choose likely obstacles you&apos;ll face
                </p>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="cap-step-heading">Conversation Framework</h3>
              <p className="cap-step-lead">
                Choose the call types this prospect should practice so the simulation matches your playbook.
              </p>

              <div className="cap-field cap-field--last">
                <div className="cap-label" id="cap-conversation-type-label">
                  Conversation Type
                  <InfoIcon title="Select one or more call scenarios. Add your own labels if needed." />
                </div>
                <ThemedMultiCombobox
                  className="cap-field-mcombo cap-mcombo--conversation"
                  options={CONVERSATION_TYPE_OPTIONS}
                  selected={conversationSelected}
                  onSelectedChange={setConversationSelected}
                  customItems={customConversationItems}
                  onCustomItemsChange={setCustomConversationItems}
                  placeholder="Select call type"
                  searchPlaceholder="Search…"
                  addCustomPlaceholder="Add custom call type…"
                  labelledBy="cap-conversation-type-label"
                  comboboxId="cap-conversation-mcombo"
                  footerMode="close"
                  showClearAll={false}
                />
                {!showConversationCustom ? (
                  <button
                    type="button"
                    className="cap-add-custom-btn cap-conv-add-custom"
                    onClick={() => setShowConversationCustom(true)}
                  >
                    ⊕ Add custom call type
                  </button>
                ) : (
                  <div className="cap-conv-custom-expand">
                    <input
                      type="text"
                      className="cap-input"
                      placeholder="Enter custom call type…"
                      value={conversationCustomDraft}
                      onChange={(e) => setConversationCustomDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addConversationCustomItem();
                        }
                      }}
                      aria-label="Custom call type"
                    />
                    <button
                      type="button"
                      className="cap-mcombo__custom-add cap-conv-custom-add-submit"
                      onClick={addConversationCustomItem}
                    >
                      Add
                    </button>
                  </div>
                )}
                <p className="cap-field-hint-text">
                  <strong>Select at least one</strong> — Preset call types and/or a custom label
                </p>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h3 className="cap-step-heading">Voice &amp; Configuration</h3>
              <p className="cap-step-lead">
                Select the voice characteristics and review your AI prospect configuration before{" "}
                {editRecord ? "saving." : "creating."}
              </p>

              <p className="cap-section-label cap-section-label--spaced">Voice selection</p>
              <div className="cap-voice-filters">
                <ThemedMenuSelect
                  buttonId="cap-voice-lang"
                  className="cap-field-select cap-voice-filter-select"
                  value={voiceLangFilter}
                  onChange={setVoiceLangFilter}
                  options={VOICE_LANG_FILTER_OPTIONS}
                />
                <ThemedMenuSelect
                  buttonId="cap-voice-kind"
                  className="cap-field-select cap-voice-filter-select"
                  value={voiceKindFilter}
                  onChange={setVoiceKindFilter}
                  options={VOICE_KIND_FILTER_OPTIONS}
                />
                <ThemedMenuSelect
                  buttonId="cap-voice-age"
                  className="cap-field-select cap-voice-filter-select"
                  value={voiceAgeFilter}
                  onChange={setVoiceAgeFilter}
                  options={VOICE_AGE_FILTER_OPTIONS}
                />
                <div className="cap-voice-search-wrap">
                  <span className="cap-voice-search-icon" aria-hidden="true">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    className="cap-input cap-voice-search-input"
                    placeholder="Search voices…"
                    value={voiceSearch}
                    onChange={(e) => setVoiceSearch(e.target.value)}
                    aria-label="Search voices"
                  />
                </div>
              </div>

              <p className="cap-voice-grid-label">
                Voices <span className="cap-voice-grid-count">({filteredVoices.length})</span>
              </p>
              {filteredVoices.length === 0 ? (
                <p className="cap-field-hint-text cap-voice-empty">
                  No voices match these filters. Try &quot;All languages&quot;, &quot;All Voices&quot;, or clear the search.
                </p>
              ) : (
                <div className="cap-voice-grid">
                  {filteredVoices.map((v) => {
                    const selected = selectedVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        className={`cap-voice-card${selected ? " is-selected" : ""}`}
                      >
                        <button
                          type="button"
                          className="cap-voice-card-select"
                          onClick={() => setSelectedVoiceId(v.id)}
                          aria-pressed={selected}
                        >
                          <span className="cap-voice-card-name">{v.name}</span>
                          <p className="cap-voice-card-blurb">{v.blurb}</p>
                          <div className="cap-voice-tags">
                            <span className="cap-voice-tag">{v.gender}</span>
                            <span className="cap-voice-tag">{v.lang}</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="cap-voice-preview-btn"
                          aria-label={`Preview voice ${v.name}`}
                          title="Preview (coming soon)"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SpeakerIcon />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <h4 className="cap-summary-title">Configuration summary</h4>
              <div className="cap-summary-card">
                <div className="cap-summary-section cap-summary-section--grid">
                  {prospectType === "b2b" ? (
                    <>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Name</span>
                        <span className="cap-summary-value">{fullName.trim() || "—"}</span>
                      </div>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Age</span>
                        <span className="cap-summary-value">{age || "—"}</span>
                      </div>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Position</span>
                        <span className="cap-summary-value">{summaryJobLabel || "—"}</span>
                      </div>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Industry</span>
                        <span className="cap-summary-value">{summaryIndustryLabel || "—"}</span>
                      </div>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Company size</span>
                        <span className="cap-summary-value">{summaryCompanySizeLabel || "—"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Name</span>
                        <span className="cap-summary-value">{fullName.trim() || "—"}</span>
                      </div>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Age</span>
                        <span className="cap-summary-value">{age || "—"}</span>
                      </div>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Occupation</span>
                        <span className="cap-summary-value">{summaryB2cOccupation || "—"}</span>
                      </div>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Monthly income</span>
                        <span className="cap-summary-value">{summaryB2cIncome || "—"}</span>
                      </div>
                      <div className="cap-summary-field">
                        <span className="cap-summary-label">Objection themes</span>
                        <span className="cap-summary-value">{summaryB2cObjectionThemes || "—"}</span>
                      </div>
                    </>
                  )}
                </div>
                <hr className="cap-summary-divider" />
                <div className="cap-summary-section cap-summary-section--grid">
                  <div className="cap-summary-field">
                    <span className="cap-summary-label">Your offer</span>
                    <span className="cap-summary-value">{productDetails.trim() || "—"}</span>
                  </div>
                  <div className="cap-summary-field">
                    <span className="cap-summary-label">Call type</span>
                    <span className="cap-summary-value">{summaryConversationText || "—"}</span>
                  </div>
                  <div className="cap-summary-field">
                    <span className="cap-summary-label">Expected objections</span>
                    <span className="cap-summary-value">{summaryChallengeText || "—"}</span>
                  </div>
                  <div className="cap-summary-field">
                    <span className="cap-summary-label">Training goals</span>
                    <span className="cap-summary-value">{summaryTrainingText || "—"}</span>
                  </div>
                  <div className="cap-summary-field">
                    <span className="cap-summary-label">Voice</span>
                    <span className="cap-summary-value">{summaryVoiceName}</span>
                  </div>
                  <div className="cap-summary-field">
                    <span className="cap-summary-label">Description</span>
                    <span className="cap-summary-value">{description.trim() || "—"}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {createError ? (
          <p className="cap-submit-error" role="alert">
            {createError}
          </p>
        ) : null}
        <div className={`cap-footer${step >= 2 ? " cap-footer--split" : ""}`}>
          {step === 1 ? (
            <button type="button" className="cap-cancel-btn" onClick={handleCancelNew}>
              Cancel
            </button>
          ) : (
            <button type="button" className="cap-back-btn" onClick={() => setStep((s) => s - 1)} disabled={creating}>
              <ArrowLeftIcon />
              Back
            </button>
          )}
          {step === 1 ? (
            <button type="button" className="cap-primary-btn" disabled={!step1Complete || creating} onClick={goStep2}>
              Continue
              <ArrowRightIcon />
            </button>
          ) : step === 2 ? (
            <button type="button" className="cap-primary-btn" disabled={!step2Complete || creating} onClick={goStep3}>
              Continue
              <ArrowRightIcon />
            </button>
          ) : step === 3 ? (
            <button type="button" className="cap-primary-btn" disabled={!step3Complete || creating} onClick={goStep4}>
              Continue
              <ArrowRightIcon />
            </button>
          ) : step === 4 ? (
            <button type="button" className="cap-primary-btn" disabled={!step4Complete || creating} onClick={advanceFromStep4}>
              Continue
              <ArrowRightIcon />
            </button>
          ) : (
            <button type="button" className="cap-primary-btn" disabled={!step5Complete || creating} onClick={handleFinishProspect}>
              {creating ? "Saving…" : editRecord ? "Save changes" : "Create prospect"}
              <ArrowRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
