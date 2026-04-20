import { DashboardRepository } from "../repositories/DashboardRepository";

export class DashboardService {
  private repository = new DashboardRepository();

  async getData() {
    return this.repository.getSummary();
  }
}