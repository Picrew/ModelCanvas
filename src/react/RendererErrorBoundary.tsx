"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  rendererId: string;
  onError?: (error: Error) => void;
}

interface State {
  error?: Error;
}

export class RendererErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError?.(error);
  }

  componentDidUpdate(previous: Props) {
    if (previous.rendererId !== this.props.rendererId && this.state.error) {
      this.setState({ error: undefined });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="renderer-state" role="alert" data-testid="renderer-error">
        <div className="state-icon danger"><AlertOctagon aria-hidden="true" /></div>
        <div>
          <p className="eyebrow">Renderer isolated</p>
          <h2>This renderer stopped safely</h2>
          <p>{this.state.error.message}</p>
          <button type="button" className="button secondary" onClick={() => this.setState({ error: undefined })}>
            <RotateCcw aria-hidden="true" /> Try again
          </button>
        </div>
      </section>
    );
  }
}

