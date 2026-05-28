export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: 'admin' | 'empresa' | 'usuario';
  businessId?: number;
  customerId?: number;
  iat?: number;
  exp?: number;
}
