/*!
    \file SpeedViewController.m
    \author zafaco GmbH <info@zafaco.de>
    \date Last update: 2020-11-03

    Copyright (C) 2016 - 2020 zafaco GmbH

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License version 3 
    as published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

#import "SpeedViewController.h"




/**************************** Loging Level ****************************/


#ifdef DEBUG
    static const DDLogLevel ddLogLevel = DDLogLevelDebug;
#else
    static const DDLogLevel ddLogLevel = DDLogLevelWarning;
#endif




@interface SpeedViewController () <SpeedDelegate>


/**************************** UI Elements ****************************/

@property (weak, nonatomic) IBOutlet UIButton *stopButton;
@property (weak, nonatomic) IBOutlet UIButton *clearButton;
@property (weak, nonatomic) IBOutlet UIButton *startButton;
@property (weak, nonatomic) IBOutlet UIButton *startRttButton;
@property (weak, nonatomic) IBOutlet UIButton *startDownloadButton;
@property (weak, nonatomic) IBOutlet UIButton *startUploadButton;

@property (weak, nonatomic) IBOutlet UILabel *statusLabel;
@property (weak, nonatomic) IBOutlet UILabel *rttLabel;
@property (weak, nonatomic) IBOutlet UILabel *downloadLabel;
@property (weak, nonatomic) IBOutlet UILabel *uploadLabel;

@property (weak, nonatomic) IBOutlet UITextView *kpisTextView;

@property (weak, nonatomic) IBOutlet UISegmentedControl *ipVersionParameters;
@property (weak, nonatomic) IBOutlet UISegmentedControl *singleStreamParameters;
@property (weak, nonatomic) IBOutlet UISegmentedControl *tlsParameters;



/**************************** Global Variables ****************************/

@property (nonatomic, strong) Speed *speed;
@property (nonatomic, strong) Tool *tool;
@property (nonatomic, strong) CLLocationManager *locationManager;

@end




@implementation SpeedViewController




/**************************** UI Handling ****************************/

- (IBAction)stopButtonTouched:(id)sender
{
    self.stopButton.enabled = false;
    [self measurementStop];
}

- (IBAction)clearButtonTouched:(id)sender
{
    self.stopButton.enabled                     = false;
    self.clearButton.enabled                    = false;
    self.startButton.enabled                    = true;
    self.startRttButton.enabled                 = true;
    self.startDownloadButton.enabled            = true;
    self.startUploadButton.enabled              = true;
    
    [self clearUI];
}

- (IBAction)startButtonTouched:(id)sender
{
    [self measurementStartWithTestCaseRtt:true withTestCaseDownload:true withTestCaseUpload:true];
}

- (IBAction)startRttButtonTouched:(id)sender
{
    [self measurementStartWithTestCaseRtt:true withTestCaseDownload:false withTestCaseUpload:false];
}

- (IBAction)startDownloadButtonTouched:(id)sender
{
    [self measurementStartWithTestCaseRtt:false withTestCaseDownload:true withTestCaseUpload:false];
}

- (IBAction)startUploadButtonTouched:(id)sender
{
    [self measurementStartWithTestCaseRtt:false withTestCaseDownload:false withTestCaseUpload:true];
}

-(void)showKpisFromResponse:(NSDictionary*)response
{
    NSString *kpis = response.description;
    kpis = [kpis stringByReplacingOccurrencesOfString:@";" withString:@""];
    self.kpisTextView.text = kpis;
    
    NSString *cmd = [response objectForKey:@"cmd"];
    
    if ([cmd isEqualToString:@"info"] || [cmd isEqualToString:@"finish"])
    {
        self.statusLabel.text = [NSString stringWithFormat:@"%@: %@", [response objectForKey:@"test_case"], [response objectForKey:@"msg"]];
    }
    
    if ([cmd isEqualToString:@"report"] || [cmd isEqualToString:@"finish"])
    {
        if ([[response objectForKey:@"test_case"] isEqualToString:@"rtt_udp"])
        {
            self.rttLabel.text = [NSString stringWithFormat:@"%@ ns", [[response objectForKey:@"rtt_udp_info"] objectForKey:@"average_ns"]];
        }
        if ([[response objectForKey:@"test_case"] isEqualToString:@"download"])
        {
            self.downloadLabel.text = [NSString stringWithFormat:@"%@ Mbit/s", [self.tool formatNumberToCommaSeperatedString:[NSNumber numberWithDouble:([[[[response objectForKey:@"download_info"] lastObject] objectForKey:@"throughput_avg_bps"] doubleValue] /1000.0 / 1000.0)] withMinDecimalPlaces:2 withMaxDecimalPlace:2]];
        }
        if ([[response objectForKey:@"test_case"] isEqualToString:@"upload"])
        {
            self.uploadLabel.text = [NSString stringWithFormat:@"%@ Mbit/s", [self.tool formatNumberToCommaSeperatedString:[NSNumber numberWithDouble:([[[[response objectForKey:@"upload_info"] lastObject] objectForKey:@"throughput_avg_bps"] doubleValue] /1000.0 / 1000.0)] withMinDecimalPlaces:2 withMaxDecimalPlace:2]];
        }
    }
}




/**************************** Measurement Handling ****************************/

-(void)measurementStartWithTestCaseRtt:(bool)rtt withTestCaseDownload:(bool)download withTestCaseUpload:(bool)upload
{
    self.speed                              = nil;
    self.speed                              = [Speed new];

    self.speed.speedDelegate                = self;
    
    self.tool                               = nil;
    self.tool                               = [Tool new];
    
    self.stopButton.enabled = true;
    
    [self clearUI];
    
    DDLogInfo(@"Measurement started");
    self.statusLabel.text = @"Measurement started";
    
    /*-------------------------set parameters for demo implementation start------------------------*/

    self.speed.targets = [NSArray arrayWithObjects:@"peer-ias-de-01", nil];
    
    if ([self.ipVersionParameters selectedSegmentIndex] == 1 || [self.ipVersionParameters selectedSegmentIndex] == 2)
    {
        NSString *targetIpVersion = @"";
        if ([self.ipVersionParameters selectedSegmentIndex] == 1)
        {
            targetIpVersion = @"-ipv4";
        }
        else if ([self.ipVersionParameters selectedSegmentIndex] == 2)
        {
            targetIpVersion = @"-ipv6";
        }

        NSMutableArray *targets = [NSMutableArray new];
        for (int i=0; i<[self.speed.targets count]; i++)
        {
            [targets addObject:[self.speed.targets[i] stringByAppendingString:targetIpVersion]];
        }
        self.speed.targets = targets;
        targets = [NSMutableArray new];
    }
    
    self.speed.performRttUdpMeasurement     = rtt;
    self.speed.performDownloadMeasurement   = download;
    self.speed.performUploadMeasurement     = upload;
    self.speed.performGeolocationLookup     = true;
    
    
    //dl/ul parameters if no speed classes are used or singleStream is active
    self.speed.parallelStreamsDownload  = [NSNumber numberWithInt:4];
    if ([self.singleStreamParameters selectedSegmentIndex] == 1)
    {
        self.speed.parallelStreamsDownload  = [NSNumber numberWithInt:1];
    }
    
    self.speed.parallelStreamsUpload    = [NSNumber numberWithInt:4];
    if ([self.singleStreamParameters selectedSegmentIndex] == 1)
    {
        self.speed.parallelStreamsUpload    = [NSNumber numberWithInt:1];
    }
    
    if ([self.tlsParameters selectedSegmentIndex] == 1)
    {
        self.speed.targetPort = @"443";
        self.speed.targetPortRtt = @"80";
        self.speed.wss  = 1;
    }

    /*-------------------------set parameters for demo implementation end------------------------*/
    
    self.stopButton.enabled                     = true;
    self.clearButton.enabled                    = false;
    self.startButton.enabled                    = false;
    self.startRttButton.enabled                 = false;
    self.startDownloadButton.enabled            = false;
    self.startUploadButton.enabled              = false;
    
    [self toggleSegmentControls:true];
    
    [self.speed measurementStart];
}

-(void)measurementStop
{
    [self.speed measurementStop];
}




/**************************** Speed Callbacks ****************************/

-(void)measurementCallbackWithResponse:(NSDictionary *)response
{
    [self showKpisFromResponse:response];
}

-(void)measurementDidCompleteWithResponse:(NSDictionary *)response withError:(NSError *)error
{
    [self showKpisFromResponse:response];
    
    if (error)
    {
        DDLogError(@"Measurement failed with Error: %@", [error.userInfo objectForKey:@"NSLocalizedDescription"]);
        self.statusLabel.text = [error.userInfo objectForKey:@"NSLocalizedDescription"];
    }
    else
    {
        DDLogInfo(@"Measurement successful");
        self.statusLabel.text = @"Measurement successful";
    }

    self.stopButton.enabled         = false;
    self.clearButton.enabled        = true;
    
    [self toggleSegmentControls:false];
}

-(void)measurementDidStop
{
    DDLogInfo(@"Measurement stopped");
    self.statusLabel.text = @"Measurement stopped";
    

    self.stopButton.enabled         = false;
    self.clearButton.enabled        = true;
    
    [self toggleSegmentControls:false];
}




/**************************** Others ****************************/

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    [DDLog removeAllLoggers];
    [DDLog addLogger:[DDTTYLogger sharedInstance]];
    [DDTTYLogger sharedInstance].logFormatter = [LogFormatter new];
    
    if ([CLLocationManager authorizationStatus] == kCLAuthorizationStatusNotDetermined || [CLLocationManager authorizationStatus] == kCLAuthorizationStatusDenied || [CLLocationManager authorizationStatus] == kCLAuthorizationStatusRestricted)
    {
        self.locationManager = [CLLocationManager new];
        [self.locationManager requestWhenInUseAuthorization];
    }
    
    DDLogInfo(@"Demo: Version %@", [NSString stringWithFormat:@"%@", [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"]]);
    
    self.stopButton.enabled                     = false;
    self.clearButton.enabled                    = false;
    self.startButton.enabled                    = true;
    self.startRttButton.enabled                 = true;
    self.startDownloadButton.enabled            = true;
    self.startUploadButton.enabled              = true;
    
    [self toggleSegmentControls:false];
    
    [self clearUI];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
}

-(void)clearUI
{
    self.statusLabel.text       = @"-";
    self.rttLabel.text          = @"-";
    self.downloadLabel.text     = @"-";
    self.uploadLabel.text       = @"-";
    
    self.kpisTextView.text      = @"";
    
    [self toggleSegmentControls:false];
}

-(void)toggleSegmentControls:(bool)disable
{
    self.ipVersionParameters.enabled        = !disable;
    self.singleStreamParameters.enabled     = !disable;
    self.tlsParameters.enabled              = !disable;
}

@end
