

export type Feature = 
  | 'smartProduct' 
  | 'aiMath' 
  | 'qrGenerator' 
  | 'ocr' 
  | 'mergePdf' 
  | 'imageExcel' 
  | 'imageToWebp' 
  | 'imgRemoveBg' 
  | 'imgChangeBg' 
  | 'resizeCropImage' 
  | 'logoMaker' 
  | 'pdfCompress' 
  | 'benefitPay' 
  | 'bmiCalculator' 
  | 'fitnessMentor' 
  | 'splitPdf' 
  | 'bmrCalculator' 
  | 'weightLoss' 
  | 'scientificCalculator' 
  | 'unitConverter' 
  | 'resizeImage' 
  | 'imageToIcon'
  | 'pdfToWord'
  | 'colorCodeGenerator'
  | 'jsonBeautifier'
  | 'cssBeautifier'
  | 'htmlBeautifier'
  | 'javascriptBeautifier'
  | 'excelToJson'
  | 'jsonToExcel'
  | 'encryptDecrypt'
  | 'csvToJson'
  | 'jsonToCsv';

export type ContactMessage = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type UserProfile = {
  name: string;
  email: string;
};

    