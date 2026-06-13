// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ProfileHeader } from "@/features/profile/components/profile-header"

describe("ProfileHeader", () => {
  it("own profile (defaults): back link → '/', title 'Profile', settings button present", () => {
    render(<ProfileHeader />)
    expect(screen.getByRole("link")).toHaveAttribute("href", "/")
    expect(screen.getByRole("heading")).toHaveTextContent("Profile")
    expect(screen.getByRole("button")).toBeTruthy()
  })

  it("friend profile: back link → '/grupo', title is the friend name, no settings button", () => {
    render(
      <ProfileHeader title="Juega David" backHref="/grupo" showSettings={false} />,
    )
    expect(screen.getByRole("link")).toHaveAttribute("href", "/grupo")
    expect(screen.getByRole("heading")).toHaveTextContent("Juega David")
    expect(screen.queryByRole("button")).toBeNull()
  })
})
