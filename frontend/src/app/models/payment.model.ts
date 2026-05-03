export interface PaymentRequest {
  userId:          string;
  abonnementId:    string;
  abonnementType:  string;
  amount:          number;
  cardNumber:      string;
  cardHolder:      string;
  expiryDate:      string;
  cvv:             string;
}

export interface PaymentResponse {
  success:         boolean;
  message:         string;
  transactionId:   string;
  abonnementId:    string;
  amount:          number;
}