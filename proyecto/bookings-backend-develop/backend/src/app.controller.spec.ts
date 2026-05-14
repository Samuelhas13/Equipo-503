/**
 * Pruebas unitarias para AppController.
 * Verifica que el endpoint de healthcheck responda correctamente
 * y se asegure de que las dependencias (como AppService) se inyecten adecuadamente.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('healthcheck', () => {
    it('should return health status', () => {
      const mockHealth = { status: 'up', timestamp: new Date().toISOString() };
      jest.spyOn(appService, 'getHealth').mockImplementation(() => mockHealth);
      
      expect(appController.getHealth()).toBe(mockHealth);
    });
  });
});
