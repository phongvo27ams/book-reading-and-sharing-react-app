import React from "react";
import SigninPage from "../SigninPage";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import { Messages } from "../../../components/FoxCharacter/FoxCharacter";

let setValidPasswordMock = vi.fn();

// Mock Navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useAuth
const mockUserRegister = vi.fn();
const mockSetMessage = vi.fn();
vi.mock("../../../provider/AuthContext", () => ({
  useAuth: () => ({
    userRegister: mockUserRegister,
    loading: false,
    setMessage: mockSetMessage,
  }),
}));

// Mock logo
vi.mock("../../assets/fox.png", () => "fox.png");

// Mock FloatingHintTextBox
vi.mock('../../../components/FloatingHintTextBox/FloatingHintTextBox.', () => {
  const React = require("react");
  return {
    default: ({ hint, value, onChange, ...props }) => (
      <input
        aria-label={hint}
        value={value}
        onChange={(e) => onChange && onChange(e)}
        {...props}
      />
    )
  };
});

// Mock PasswordReqList
vi.mock("../../../components/PasswordReqList/PasswordReqList", () => {
  return {
    default: ({ onValidityChange }) => {
      setValidPasswordMock = onValidityChange;
      return <div>PasswordReqList mock</div>;
    },
  };
});

describe("SigninPage - Basic Render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Renders logo, title, inputs, buttons, link, loader container", () => {
    render(
      <MemoryRouter>
        <SigninPage />
      </MemoryRouter>
    );

    // Logo
    expect(screen.getByRole("img")).toBeInTheDocument();

    // Title
    expect(screen.getByText("SIGN UP")).toBeInTheDocument();

    // Step 1 inputs
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();

    // Step 2 inputs
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-input")).toBeInTheDocument();

    // Buttons
    expect(screen.getByText(/Go to next step/i)).toBeInTheDocument();
    expect(screen.getByText(/Join the Foxes/i)).toBeInTheDocument();

    // Link
    expect(screen.getByText(/Are you a Fox/i)).toBeInTheDocument();
  });
});

describe("SigninPage - Step 1 validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Shows BLANK message when fields are empty", async () => {
    render(
      <MemoryRouter>
        <SigninPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Go to next step/i));

    await waitFor(() => {
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
    });
  });

  test("Shows INVALID_EMAIL message when email is invalid", async () => {
    render(
      <MemoryRouter>
        <SigninPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "user1" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Doe" } });

    fireEvent.click(screen.getByText(/Go to next step/i));

    await waitFor(() => {
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.INVALID_EMAIL);
    });
  });

  test("Proceeds to next step when all fields are valid", async () => {
    render(
      <MemoryRouter>
        <SigninPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "user1" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Doe" } });

    fireEvent.click(screen.getByText(/Go to next step/i));

    await waitFor(() => {
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.PASSWORD);
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
    });
  });
});

describe("SigninPage - Step 2 registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillStep1 = () => {
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "user1" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Doe" } });
    fireEvent.click(screen.getByText(/Go to next step/i));
  };

  test("Shows INVALID_PASSWORD when password is invalid", async () => {
    render(
      <MemoryRouter>
        <SigninPage />
      </MemoryRouter>
    );

    fillStep1();

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Abc123!" } });
    fireEvent.change(screen.getByTestId("confirm-input"), { target: { value: "Abc123!" } });

    // validPassword state is false, simulate by leaving it false
    fireEvent.click(screen.getByText(/Join the Foxes/i));

    await waitFor(() => {
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.INVALID_PASSWORD);
      expect(mockUserRegister).not.toHaveBeenCalled();
    });
  });

  test("Calls userRegister with valid password and resets fields", async () => {
    mockUserRegister.mockResolvedValue(true); // Ensure registered

    render(
      <MemoryRouter>
        <SigninPage />
      </MemoryRouter>
    );

    fillStep1();

    await waitFor(() => screen.getByTestId("password-input"));

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Abc123!" } });
    fireEvent.change(screen.getByTestId("confirm-input"), { target: { value: "Abc123!" } });

    act(() => {
      setValidPasswordMock(true);
    });

    fireEvent.click(screen.getByText(/Join the Foxes/i));

    await waitFor(() => {
      expect(mockUserRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "user1",
          email: "user@example.com",
          password: "Abc123!",
          fName: "John",
          lName: "Doe",
          balance: 0,
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
      expect(screen.getByLabelText(/Username/i).value).toBe("");
      expect(screen.getByLabelText(/Email/i).value).toBe("");
      expect(screen.getByLabelText(/First name/i).value).toBe("");
      expect(screen.getByLabelText(/Last name/i).value).toBe("");
    });
  });
});