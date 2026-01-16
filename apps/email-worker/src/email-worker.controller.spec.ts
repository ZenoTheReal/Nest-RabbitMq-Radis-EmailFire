import { Test, TestingModule } from '@nestjs/testing';
import { EmailWorkerController } from './email-worker.controller';
import { EmailWorkerService } from './email-worker.service';

describe('EmailWorkerController', () => {
  let emailWorkerController: EmailWorkerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EmailWorkerController],
      providers: [EmailWorkerService],
    }).compile();

    emailWorkerController = app.get<EmailWorkerController>(EmailWorkerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(emailWorkerController.getHello()).toBe('Hello World!');
    });
  });
});
