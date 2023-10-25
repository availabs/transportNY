import { composeTheme, makeProxy, $compositions } from "~/modules/avl-map-2/src"

const NewThemeBase = {
  LayerSidebarContainer: 'w-full h-full max-h-full relative bg-slate-100',
  LayerSidebarPanelContainer: 'w-80 h-full max-h-full  bg-white rounded-b pointer-events-auto overflow-auto scrollbar-sm',
  LayerSidebarToggle:`
    h-8 w-8 bg-slate-100 text-xl
    flex items-center justify-center
    cursor-pointer 
    pointer-events-auto absolute
    text-slate-400
    hover:text-blue-400`,
  LayerSidebarTab: 'h-8 w-10 border-b-2 border-slate-100 cursor-pointer pointer-events-auto relative  bg-slate-100 text-slate-300',
  LayerSidebarTabActive: 'h-8 w-10 cursor-pointer border-b-2 border-blue-500 pointer-events-auto relative  bg-slate-100 text-blue-500',


  bgInput: "bg-white",
  bgInputHover: "hover:bg-white",

  bgLegend: "bg-neutral-400",
  bgLegendHover: "hover:bg-neutral-400",

  bgContrast: "bg-neutral-800",
  bgContrastHover: "hover:bg-neutral-800",

  textContrast: "text-white",
  textContrastHover: "hover:text-white",

  text: "text-neutral-800 disabled:text-neutral-400 placeholder:text-neutral-400",
  textDisabled: "text-neutral-400 disabled:text-neutral-400 placeholder:text-neutral-400",
  bg: "bg-neutral-200",
  border: "border-neutral-800",
  outline: "outline-neutral-800",

  textButton: "text-neutral-400 disabled:text-neutral-400 placeholder:text-neutral-400",
  bgButton: "bg-neutral-400",
  bgButtonHover: "hover:bg-neutral-400",
  borderButton: "border-neutral-400",
  outlineButton: "outline-neutral-400",

  textInfo: "text-teal-400 disabled:text-teal-400 placeholder:text-teal-400",
  bgInfo: "bg-teal-400",
  bgInfoHover: "hover:bg-teal-400",
  borderInfo: "border-teal-400",
  outlineInfo: "outline-teal-400",

  textSuccess: "text-green-400 disabled:text-green-400 placeholder:text-green-400",
  bgSuccess: "bg-green-400",
  bgSuccessHover: "hover:bg-green-400",
  borderSuccess: "border-green-400",
  outlineSuccess: "outline-green-400",

  textPrimary: "text-blue-400 disabled:text-blue-400 placeholder:text-blue-400",
  bgPrimary: "bg-blue-400",
  bgPrimaryHover: "hover:bg-blue-400",
  borderPrimary: "border-blue-400",
  outlinePrimary: "outline-blue-400",

  textDanger: "text-red-400 disabled:text-red-400 placeholder:text-red-400",
  bgDanger: "bg-red-400",
  bgDangerHover: "hover:bg-red-400",
  borderDanger: "border-red-400",
  outlineDanger: "outline-red-400",

  textWarning: "text-yellow-400 disabled:text-yellow-400 placeholder:text-yellow-400",
  bgWarning: "bg-yellow-400",
  bgWarningHover: "hover:bg-yellow-400",
  borderWarning: "border-yellow-400",
  outlineWarning: "outline-yellow-400",

  textSmall: "text-sm",
  textBase: "text-base",
  textLarge: "text-lg",

  paddingSmall: "py-0 px-1",
  paddingBase: "py-1 px-2",
  paddingLarge: "py-2 px-4",

  bgAccent1: "bg-neutral-300",
  bgAccent2: "bg-neutral-400",
  bgAccent3: "bg-neutral-500",
  bgAccent4: "bg-neutral-600",

  bgAccent1Hover: "hover:bg-neutral-300",
  bgAccent2Hover: "hover:bg-neutral-400",
  bgAccent3Hover: "hover:bg-neutral-500",
  bgAccent4Hover: "hover:bg-neutral-600",

  textHighlight: "text-sky-600",
  textHighlightHover: "hover:text-sky-600",

  borderHighlight: "border-sky-600",
  borderHighlightHover: "hover:border-sky-600",

  bgHighlight: "bg-sky-600",
  bgHighlightHover: "hover:bg-sky-600",

  transition: "transition ease-in-out duration-150",

  $compositions
};

const ComposedNewTheme = composeTheme(NewThemeBase);
const NewTheme = makeProxy(ComposedNewTheme);

export default NewTheme;
