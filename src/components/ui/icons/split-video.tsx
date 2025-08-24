import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect } from 'react-native-svg';

export const SplitVideo = ({ color = '#000', ...props }: SvgProps) => (
  <Svg width={24} height={24} fill="none" viewBox="0 0 24 24" {...props}>
    {/* 主要影片框架 */}
    <Rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />

    {/* 分割線 */}
    <Path d="M8 4V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M16 4V20" stroke={color} strokeWidth="2" strokeLinecap="round" />

    {/* 播放按鈕指示器 */}
    <Path
      d="M6 8L10 12L6 16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 8L18 12L14 16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* 時間指示器 */}
    <Rect x="4" y="18" width="2" height="2" fill={color} />
    <Rect x="10" y="18" width="2" height="2" fill={color} />
    <Rect x="16" y="18" width="2" height="2" fill={color} />
  </Svg>
);
