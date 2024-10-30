export interface ErrorResponse {
    status: string;
    message: string;
    errors?: any[];
    stack?: string;
  }
  
  export interface ValidationError {
    field: string;
    message: string;
  }