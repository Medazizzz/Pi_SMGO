import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8090/api/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send login request', () => {
    const credentials = { username: 'testuser', password: 'password123' };
    const mockResponse = { token: 'jwt.token', username: 'testuser' };

    service.login(credentials).subscribe(response => {
      expect(response.token).toBe('jwt.token');
    });

    const req = httpMock.expectOne(`${API_URL}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should send register request', () => {
    const userData = { username: 'newuser', password: 'pass123', email: 'new@example.com' };
    const mockResponse = { token: 'jwt.token', username: 'newuser' };

    service.register(userData).subscribe(response => {
      expect(response.token).toBe('jwt.token');
    });

    const req = httpMock.expectOne(`${API_URL}/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should store token after login', () => {
    const credentials = { username: 'testuser', password: 'password123' };
    const mockResponse = { token: 'jwt.token' };
    spyOn(localStorage, 'setItem');

    service.login(credentials).subscribe();

    const req = httpMock.expectOne(`${API_URL}/login`);
    req.flush(mockResponse);

    expect(localStorage.setItem).toHaveBeenCalled();
  });
});
