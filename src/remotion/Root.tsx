import { Composition, Folder } from 'remotion'
import {
  ExecutiveCockpitComposition,
  FinanceAutomationComposition,
  ProductPositioningComposition,
  ProductShowreelComposition,
  SalesDepartmentFlowComposition,
} from './scenes/ProductStory'

export const RemotionRoot = () => {
  return (
    <Folder name="product-story">
      <Composition
        id="ProductPositioning"
        component={ProductPositioningComposition}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SalesDepartmentFlow"
        component={SalesDepartmentFlowComposition}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FinanceAutomation"
        component={FinanceAutomationComposition}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ExecutiveCockpit"
        component={ExecutiveCockpitComposition}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProductShowreel"
        component={ProductShowreelComposition}
        durationInFrames={1140}
        fps={30}
        width={1920}
        height={1080}
      />
    </Folder>
  )
}
