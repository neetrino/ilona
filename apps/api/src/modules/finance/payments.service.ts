import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@ilona/database';
import { CreatePaymentDto, UpdatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';
import { PaymentQueryService } from './payment-query.service';
import { PaymentWriteService } from './payment-write.service';
import { PaymentSummaryService } from './payment-summary.service';
import { PaymentLifecycleService } from './payment-lifecycle.service';

export type { PaymentWindowReason } from './payment.util';
export { isPaymentAllowedInWindow } from './payment.util';

/** Facade for payments — delegates to domain-specific services. */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly queryService: PaymentQueryService,
    private readonly writeService: PaymentWriteService,
    private readonly summaryService: PaymentSummaryService,
    private readonly lifecycleService: PaymentLifecycleService,
  ) {}

  findAll(params?: {
    skip?: number;
    take?: number;
    studentId?: string;
    status?: PaymentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    q?: string;
    centerId?: string;
  }) {
    return this.queryService.findAll(params);
  }

  findMonthlyGroupedForStudent(params: {
    studentId: string;
    skip?: number;
    take?: number;
    status?: PaymentStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    return this.queryService.findMonthlyGroupedForStudent(params);
  }

  findById(id: string) {
    return this.queryService.findById(id);
  }

  findByIdAndStudentId(paymentId: string, studentId: string) {
    return this.queryService.findByIdAndStudentId(paymentId, studentId);
  }

  create(dto: CreatePaymentDto) {
    return this.writeService.create(dto);
  }

  update(id: string, dto: UpdatePaymentDto) {
    return this.writeService.update(id, dto);
  }

  processPayment(id: string, dto: ProcessPaymentDto) {
    return this.writeService.processPayment(id, dto);
  }

  processPaymentForStudent(paymentId: string, studentId: string, dto: ProcessPaymentDto) {
    return this.writeService.processPaymentForStudent(paymentId, studentId, dto);
  }

  cancel(id: string) {
    return this.writeService.cancel(id);
  }

  delete(id: string) {
    return this.writeService.delete(id);
  }

  deleteMany(ids: string[]) {
    return this.writeService.deleteMany(ids);
  }

  getStudentPaymentSummary(studentId: string) {
    return this.summaryService.getStudentPaymentSummary(studentId);
  }

  ensureMonthlyPayments(studentId: string) {
    return this.lifecycleService.ensureMonthlyPayments(studentId);
  }

  ensureCurrentMonthPaymentsForActiveStudents() {
    return this.lifecycleService.ensureCurrentMonthPaymentsForActiveStudents();
  }

  checkOverduePayments() {
    return this.lifecycleService.checkOverduePayments();
  }

  getRevenueStats(dateFrom?: Date, dateTo?: Date, centerId?: string) {
    return this.summaryService.getRevenueStats(dateFrom, dateTo, centerId);
  }
}
