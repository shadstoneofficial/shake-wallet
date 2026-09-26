import {GenericService} from "@src/util/svc";

class AnalyticsService extends GenericService {
  async initTracking() {}

  async track(_name: string, _data?: any) {}

  async start() {}

  async stop() {}
}

export default AnalyticsService;
