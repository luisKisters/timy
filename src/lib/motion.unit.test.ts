import { describe, expect, test } from "vitest";
import {
  checkPop,
  collapseOut,
  fadeInUp,
  INSTANT,
  pressScale,
  sheetPanel,
  staggerContainer,
} from "@/lib/motion";

type Obj = Record<string, unknown>;

describe("motion reduced-motion contract", () => {
  test("fadeInUp lifts with a y transform normally, opacity-only when reduced", () => {
    expect((fadeInUp(false).hidden as Obj).y).toBe(8);
    expect((fadeInUp(true).hidden as Obj).y).toBeUndefined();
    expect((fadeInUp(true).show as Obj).transition).toBe(INSTANT);
  });

  test("sheetPanel slides from 100% normally, no transform when reduced", () => {
    expect((sheetPanel(false).hidden as Obj).y).toBe("100%");
    expect((sheetPanel(true).hidden as Obj).y).toBeUndefined();
    expect((sheetPanel(true).exit as Obj).transition).toBe(INSTANT);
  });

  test("checkPop scales in normally, no scale when reduced", () => {
    expect((checkPop(false).hidden as Obj).scale).toBe(0);
    expect((checkPop(true).hidden as Obj).scale).toBeUndefined();
  });

  test("collapseOut animates height normally, no height transform when reduced", () => {
    expect((collapseOut(false).exit as Obj).height).toBe(0);
    expect((collapseOut(true).exit as Obj).height).toBeUndefined();
  });

  test("pressScale shrinks normally, is empty (no transform) when reduced", () => {
    expect(pressScale(false)).toEqual({ scale: 0.97 });
    expect(pressScale(true)).toEqual({});
  });

  test("staggerContainer staggers children normally, disabled when reduced", () => {
    const normal = (staggerContainer(false).show as Obj).transition as Obj;
    expect(normal.staggerChildren).toBe(0.05);
    expect((staggerContainer(true).show as Obj).transition).toEqual({});
  });
});
