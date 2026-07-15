import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  LanguageProvider,
  LanguageToggle,
  useLanguage,
} from "@/src/react/i18n";

function ExampleText() {
  const { tr } = useLanguage();
  return <p>{tr("Examples", "示例")}</p>;
}

describe("language preference", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults to English and persists an explicit Chinese selection", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageToggle />
        <ExampleText />
      </LanguageProvider>,
    );

    expect(screen.getByText("Examples")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "中文" }));

    expect(screen.getByText("示例")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("zh-CN");
      expect(window.localStorage.getItem("modelcanvas-language")).toBe("zh");
    });
  });
});
