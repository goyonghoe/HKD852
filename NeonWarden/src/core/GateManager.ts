import { CreatureDef, CREATURE_DEFS } from "../config/creatures";

export interface GateArrival {
  def: CreatureDef;
  decided: boolean;
  admitted: boolean;
}

export class GateManager {
  public currentArrivals: GateArrival[] = [];
  public isGateOpen: boolean = false;
  private gateTimer: number = 12000; // start at 12s so first gate opens at 8s
  private readonly GATE_INTERVAL = 20000; // every 20 seconds
  private readonly GATE_DURATION = 10000; // 10 seconds to decide
  private readonly RESULT_DISPLAY_TIME = 1500; // show result 1.5s before closing
  private gateCloseTimer: number = 0;
  private resultTimer: number = 0;
  private showingResults: boolean = false;

  public update(delta: number): void {
    if (!this.isGateOpen) {
      this.gateTimer += delta;
      if (this.gateTimer >= this.GATE_INTERVAL) {
        this.gateTimer = 0;
        this.openGate();
      }
      return;
    }

    // Showing results phase — wait then close
    if (this.showingResults) {
      this.resultTimer += delta;
      if (this.resultTimer >= this.RESULT_DISPLAY_TIME) {
        this.closeGate();
      }
      return;
    }

    // Decision phase
    this.gateCloseTimer += delta;
    if (this.gateCloseTimer >= this.GATE_DURATION) {
      this.autoRejectUndecided();
      this.startResultDisplay();
    }
  }

  private openGate(): void {
    this.isGateOpen = true;
    this.gateCloseTimer = 0;
    this.showingResults = false;
    this.resultTimer = 0;
    const count = Math.random() < 0.5 ? 2 : 3;
    this.currentArrivals = [];
    for (let i = 0; i < count; i++) {
      const def =
        CREATURE_DEFS[Math.floor(Math.random() * CREATURE_DEFS.length)];
      this.currentArrivals.push({ def, decided: false, admitted: false });
    }
  }

  private autoRejectUndecided(): void {
    for (const a of this.currentArrivals) {
      if (!a.decided) {
        a.decided = true;
        a.admitted = false;
      }
    }
  }

  private startResultDisplay(): void {
    this.showingResults = true;
    this.resultTimer = 0;
  }

  private closeGate(): void {
    this.isGateOpen = false;
    this.showingResults = false;
  }

  public admit(index: number): void {
    if (index < this.currentArrivals.length && !this.showingResults) {
      this.currentArrivals[index].decided = true;
      this.currentArrivals[index].admitted = true;
    }
    this.checkAllDecided();
  }

  public reject(index: number): void {
    if (index < this.currentArrivals.length && !this.showingResults) {
      this.currentArrivals[index].decided = true;
      this.currentArrivals[index].admitted = false;
    }
    this.checkAllDecided();
  }

  private checkAllDecided(): void {
    if (this.currentArrivals.every((a) => a.decided)) {
      this.startResultDisplay();
    }
  }

  public getAdmitted(): CreatureDef[] {
    return this.currentArrivals
      .filter((a) => a.decided && a.admitted)
      .map((a) => a.def);
  }

  public consumeAdmitted(): CreatureDef[] {
    const admitted = this.getAdmitted();
    this.currentArrivals = this.currentArrivals.filter(
      (a) => !(a.decided && a.admitted),
    );
    return admitted;
  }
}
