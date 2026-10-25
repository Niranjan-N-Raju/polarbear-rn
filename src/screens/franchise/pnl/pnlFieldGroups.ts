import type { TranslationKey } from '../../../i18n';

export interface PnlField {
  key: string;
  label: TranslationKey;
}

export interface PnlFieldGroup {
  title: TranslationKey;
  fields: PnlField[];
}

export const pnlFieldGroups: PnlFieldGroup[] = [
  { title: 'franchisePnlOfficeMaintenance', fields: [
    { key: 'omGarbageCharges', label: 'franchisePnlGarbageCharges' },
    { key: 'omSecurityCharges', label: 'franchisePnlSecurityCharges' },
    { key: 'omBroomsMopEtc', label: 'franchisePnlBroomsMop' },
    { key: 'omShoeUniforms', label: 'franchisePnlShoeUniforms' },
    { key: 'omPlasticItems', label: 'franchisePnlPlasticItems' },
    { key: 'omPestControl', label: 'franchisePnlPestControl' },
    { key: 'omOthers', label: 'franchisePnlOthers' },
  ] },
  { title: 'franchisePnlRepairMaintenance', fields: [
    { key: 'rmDisplayMachine', label: 'franchisePnlDisplayMachineRepair' },
    { key: 'rmFreezer', label: 'franchisePnlFreezerRepair' },
    { key: 'rmAc', label: 'franchisePnlAcRepair' },
    { key: 'rmComputer', label: 'franchisePnlComputerRepair' },
    { key: 'rmMixie', label: 'franchisePnlMixieRepair' },
    { key: 'rmMicroOven', label: 'franchisePnlMicroOvenRepair' },
    { key: 'rmElectrical', label: 'franchisePnlElectricalRepair' },
    { key: 'rmLight', label: 'franchisePnlLightRepair' },
    { key: 'rmGenerator', label: 'franchisePnlGeneratorRepair' },
    { key: 'rmSandwichCone', label: 'franchisePnlSandwichMachine' },
    { key: 'rmOthers', label: 'franchisePnlOthers' },
  ] },
  { title: 'franchisePnlStaffSalary', fields: [{ key: 'staffSalary', label: 'franchisePnlStaffSalary' }] },
  { title: 'franchisePnlStaffWelfare', fields: [
    { key: 'swFoodAllowance', label: 'franchisePnlFoodAllowance' },
    { key: 'swLunch', label: 'franchisePnlLunch' },
    { key: 'swRoomGas', label: 'franchisePnlRoomGas' },
    { key: 'swRoomElectricity', label: 'franchisePnlRoomElectricity' },
    { key: 'swRoomWater', label: 'franchisePnlRoomWater' },
    { key: 'swRoomDrinkingWater', label: 'franchisePnlRoomDrinkingWater' },
    { key: 'swOthers', label: 'franchisePnlOthers' },
  ] },
  { title: 'franchisePnlWaterCharges', fields: [
    { key: 'wcDrinkingWater', label: 'franchisePnlDrinkingWaterCharges' },
    { key: 'wcParlourWaterEB', label: 'franchisePnlParlourWaterEb' },
    { key: 'wcWaterTanker', label: 'franchisePnlWaterTanker' },
  ] },
  { title: 'franchisePnlDieselPetrol', fields: [{ key: 'dieselPetrol', label: 'franchisePnlDieselPetrol' }] },
  { title: 'franchisePnlTelephoneCharges', fields: [{ key: 'telephoneCharges', label: 'franchisePnlTelephoneCharges' }] },
  { title: 'franchisePnlBankCharges', fields: [{ key: 'bankCharges', label: 'franchisePnlBankCharges' }] },
  { title: 'franchisePnlAdvertisement', fields: [
    { key: 'advLiveRadio', label: 'franchisePnlLiveRadio' },
    { key: 'advLeaflets', label: 'franchisePnlLeaflets' },
    { key: 'advDiscountVouchers', label: 'franchisePnlDiscountVouchers' },
    { key: 'advApiIntegration', label: 'franchisePnlApiIntegration' },
  ] },
  { title: 'franchisePnlConveyance', fields: [
    { key: 'cvAutoRapido', label: 'franchisePnlAutoRapido' },
    { key: 'cvBusMetroCab', label: 'franchisePnlBusMetroCab' },
    { key: 'cvVehiclePetrol', label: 'franchisePnlVehiclePetrol' },
  ] },
  { title: 'franchisePnlPrintingStationery', fields: [
    { key: 'psXeroxLamination', label: 'franchisePnlXeroxLamination' },
    { key: 'psNotebookPenMarker', label: 'franchisePnlNotebookPenMarker' },
    { key: 'psCourierNewspaper', label: 'franchisePnlCourierNewspaper' },
  ] },
  { title: 'franchisePnlMagazines', fields: [
    { key: 'mpHijida', label: 'franchisePnlHijida' },
    { key: 'mpPolice', label: 'franchisePnlPolice' },
  ] },
  { title: 'franchisePnlRatesTaxes', fields: [
    { key: 'rtLicenses', label: 'franchisePnlLicenses' },
    { key: 'rtParlourInsurance', label: 'franchisePnlParlourInsurance' },
  ] },
  { title: 'franchisePnlRoyalty', fields: [{ key: 'royalty', label: 'franchisePnlRoyalty' }] },
  { title: 'franchisePnlMiscellaneous', fields: [{ key: 'miscellaneous', label: 'franchisePnlMiscellaneous' }] },
];

export const pnlExpenseKeys = [
  'food', 'packaging', 'houseKeeping', 'localPurchase', 'wastage', 'swiggyFee', 'amazonFee', 'dotPeFee', 'zomatoFee',
  'rent', 'rentStaffRoom', 'electricityCharges', ...pnlFieldGroups.flatMap((group) => group.fields.map((field) => field.key)),
];
export const pnlCostOfGoodsKeys = ['food', 'wastage', 'packaging'];
export const pnlRentKeys = ['rent', 'rentStaffRoom'];

export const pnlAllInputKeys = [
  'netSales', 'nob', 'food', 'packaging', 'houseKeeping', 'localPurchase', 'wastage', 'swiggyFee', 'zomatoFee',
  'amazonFee', 'dotPeFee', 'rent', 'rentStaffRoom', 'electricityCharges', ...pnlFieldGroups.flatMap((group) => group.fields.map((field) => field.key)),
];
