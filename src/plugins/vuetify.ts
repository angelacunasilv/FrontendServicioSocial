import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { es } from 'vuetify/locale';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import {
  mdiHomeOutline, mdiAccountOutline, mdiAccountGroupOutline, mdiBookOpenPageVariantOutline,
  mdiFileDocumentOutline, mdiClipboardCheckOutline, mdiDomain, mdiSchoolOutline,
  mdiChartBoxOutline, mdiFileCertificateOutline, mdiMenu, mdiLogout, mdiHelpCircleOutline,
  mdiMagnify, mdiPlus, mdiPencilOutline, mdiDownload, mdiEyeOutline, mdiEyeOffOutline,
  mdiChevronRight, mdiClose, mdiRefresh, mdiUpload, mdiCheckCircleOutline, mdiLockOutline,
  mdiPrinterOutline, mdiEmailOutline, mdiAccountCircle, mdiArchiveOutline, mdiArrowLeft,
  mdiFilePdfBox, mdiChevronDown, mdiShieldAccountOutline,
} from '@mdi/js';

export default createVuetify({
  display: { mobileBreakpoint: 960 },
  locale: { locale: 'es', messages: { es } },
  icons: {
    defaultSet: 'mdi',
    sets: { mdi },
    aliases: {
      ...aliases, home: mdiHomeOutline, user: mdiAccountOutline, users: mdiAccountGroupOutline,
      bank: mdiBookOpenPageVariantOutline, document: mdiFileDocumentOutline, review: mdiClipboardCheckOutline,
      company: mdiDomain, school: mdiSchoolOutline, report: mdiChartBoxOutline,
      certificate: mdiFileCertificateOutline, menu: mdiMenu, logout: mdiLogout, help: mdiHelpCircleOutline,
      search: mdiMagnify, plus: mdiPlus, edit: mdiPencilOutline, download: mdiDownload,
      eye: mdiEyeOutline, eyeOff: mdiEyeOffOutline, chevron: mdiChevronRight, close: mdiClose,
      refresh: mdiRefresh, upload: mdiUpload, check: mdiCheckCircleOutline, lock: mdiLockOutline,
      print: mdiPrinterOutline, email: mdiEmailOutline, account: mdiAccountCircle, archive: mdiArchiveOutline,
      back: mdiArrowLeft, pdf: mdiFilePdfBox, down: mdiChevronDown, shield: mdiShieldAccountOutline,
    },
  },
  theme: {
    defaultTheme: 'institucional',
    themes: {
      institucional: { dark: false, colors: {
        primary: '#1B396A', secondary: '#52647C', background: '#FFFFFF', surface: '#FFFFFF',
        error: '#B42332', success: '#23734D', warning: '#895C13', info: '#1B396A',
      } },
    },
  },
  defaults: {
    VBtn: { elevation: 0, rounded: 'sm', style: 'text-transform: none; letter-spacing: normal' },
    VTextField: { variant: 'outlined', density: 'compact', color: 'primary' },
    VTextarea: { variant: 'outlined', density: 'compact', color: 'primary', rows: 3, autoGrow: true },
    VFileInput: { variant: 'outlined', density: 'compact', color: 'primary', prependIcon: '', prependInnerIcon: '$upload' },
    VCard: { elevation: 0, rounded: 'sm' },
    VAlert: { variant: 'tonal', density: 'compact', rounded: 'sm' },
    VTable: { density: 'comfortable' },
  },
});
